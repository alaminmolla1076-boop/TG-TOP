// 2FA password helpers. The MTProto plumbing lives in mtproto.js — this file
// keeps the app-level API (set / reset / remove with retries) unchanged.
import { Mt, setTwoFactor, removeTwoFactor, generatePassword } from './mtproto.js';

export { generatePassword };

// Retrying a wrong password is what triggers Telegram's FLOOD_WAIT lockout
// (the account then rejects the real password for ~40 minutes), so these
// errors must abort immediately instead of being retried.
function isFatal2faError(e) {
  const m = String(e?.message || e || '');
  return /PASSWORD_HASH_INVALID|FLOOD_WAIT|PASSWORD_TOO_FRESH|SESSION_TOO_FRESH/i.test(m);
}

// Sets (or changes) the 2FA cloud password on an authenticated connection.
export async function setTwoFactorPassword(mt, newPassword, currentPassword, hint = 'tgtop') {
  await setTwoFactor(mt, newPassword, currentPassword || '', hint);
}

// Removes the 2FA cloud password from an authenticated connection.
export async function removeTwoFactorPassword(mt, currentPassword) {
  await removeTwoFactor(mt, currentPassword);
}

// Connects to a stored session and resets that account's 2FA password.
export async function resetAccountPassword(sessionString, currentPassword, newPassword, hint = 'tgtop') {
  const mt = new Mt(sessionString);
  await setTwoFactor(mt, newPassword, currentPassword || '', hint);
}

// Connects to a stored session and removes that account's 2FA password.
export async function removeAccountPassword(sessionString, currentPassword) {
  const mt = new Mt(sessionString);
  await removeTwoFactor(mt, currentPassword);
}

// Rotates the account's 2FA password to a fresh one, with retries.
// Returns the new password on success, or null if every attempt failed.
export async function rotateAccountPasswordWithRetry(sessionString, currentPassword, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const newPassword = generatePassword(10);
    try {
      await resetAccountPassword(sessionString, currentPassword || '', newPassword);
      return newPassword;
    } catch (e) {
      console.error(`2FA rotation attempt ${attempt}/${maxAttempts} failed:`, e?.message || String(e));
      if (isFatal2faError(e)) return null;
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

// Asks Telegram whether the account still has a cloud password.
export async function hasTwoFactor(sessionString) {
  const mt = new Mt(sessionString);
  const pwd = await mt.call('account.getPassword', {});
  return !!pwd.has_password;
}

// Guarantees 2FA is gone: retries removal, then independently re-checks with
// Telegram on a fresh connection. Returns true ONLY when has_password is false.
export async function clearTwoFactorGuaranteed(sessionString, currentPassword, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await removeAccountPassword(sessionString, currentPassword || '');
    } catch (e) {
      console.error(`2FA clear attempt ${attempt}/${maxAttempts} failed:`, e?.message || String(e));
      if (isFatal2faError(e)) return false;
    }
    try {
      if (!(await hasTwoFactor(sessionString))) return true;
    } catch (e) {
      console.error(`2FA verify attempt ${attempt}/${maxAttempts} failed:`, e?.message || String(e));
    }
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  return false;
}

// Removes 2FA with retries. Returns true on success, false if all attempts fail.
export async function removeAccountPasswordWithRetry(sessionString, currentPassword, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await removeAccountPassword(sessionString, currentPassword);
      return true;
    } catch (e) {
      console.error(`2FA removal attempt ${attempt}/${maxAttempts} failed:`, e?.message || String(e));
      if (isFatal2faError(e)) return false;
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return false;
}