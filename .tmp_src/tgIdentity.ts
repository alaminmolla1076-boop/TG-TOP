// Verifies a Telegram Mini App `initData` string and returns the Telegram user.
// This is the app's identity source: the signature can only be produced by
// Telegram using the bot token, so a valid payload proves who the caller is.
const enc = new TextEncoder();
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', key, {
    name: 'HMAC',
    hash: 'SHA-256'
  }, false, [
    'sign'
  ]);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
function hex(bytes) {
  return [
    ...bytes
  ].map((b)=>b.toString(16).padStart(2, '0')).join('');
}
// Max age of an initData payload — blocks replay of an old signed string.
const MAX_AGE_SECONDS = 24 * 60 * 60;
export async function verifyInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheckString = [
    ...params.entries()
  ].map(([k, v])=>`${k}=${v}`).sort().join('\n');
  const secret = await hmac(enc.encode('WebAppData'), botToken);
  const expected = hex(await hmac(secret, dataCheckString));
  if (expected !== hash) return null;
  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;
  try {
    const user = JSON.parse(params.get('user') || 'null');
    return user && user.id ? user : null;
  } catch  {
    return null;
  }
}
export function identityEmail(telegramId) {
  return `tg${String(telegramId)}@telegram.local`;
}
