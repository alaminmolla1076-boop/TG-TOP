import { runSql, sqlString } from './webApi.ts';
import { secrets } from './b44.ts';

const enc = new TextEncoder();

async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Verifies Telegram Mini App initData against the bot token, per Telegram's spec.
// Byte-for-byte port of the previous Base44-hosted verifier (no auth-date age
// limit, same error messages) so the web app behaves exactly as before.
async function verifyInitData(initData) {
  const botToken = secrets.get('TELEGRAM_BOT_TOKEN');
  const params = [...new URLSearchParams(initData).entries()];
  const hash = params.find(([k]) => k === 'hash')?.[1];
  if (!botToken || !hash) throw new Error('Telegram login verification failed');
  const checkString = params
    .filter(([k]) => k !== 'hash')
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKeyRaw = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const secretKey = await crypto.subtle.sign('HMAC', secretKeyRaw, enc.encode(botToken));
  const computed = await hmacSha256(secretKey, checkString);
  if (computed !== hash) throw new Error('Telegram login verification failed');
  const userRaw = new URLSearchParams(initData).get('user');
  if (!userRaw) throw new Error('No Telegram user in login data');
  return JSON.parse(userRaw);
}

// Short-lived identity cache: verifying initData + the profile lookup costs a
// management-API roundtrip, and every function call pays it. A 30s cache
// keeps page loads fast; role/ban changes apply within 30s.
const IDENTITY_CACHE_MS = 30000;
const identityCache = new Map();

// Resolves the acting Telegram user from initData (required — the app must be
// opened from the Telegram bot). Sign-up, profile creation and wallet setup all
// happen in the existing Supabase system (b44fn telegramWebAppAuth at login) —
// here we only READ the user's records to know their role and balance.
export async function resolveIdentity(initData) {
  if (!initData) throw new Error('Open the app from Telegram to continue');
  const cached = identityCache.get(initData);
  if (cached && Date.now() - cached.ts < IDENTITY_CACHE_MS) return cached.value;
  const tgUser = await verifyInitData(initData);

  const telegramId = String(tgUser.id);
  const identityEmail = `tg${telegramId}@telegram.local`;

  const rows = await runSql(
    `select u.banned as tg_banned, p.role, p.balance, p.banned as profile_banned
     from tg_web_users u
     left join profiles p on p.email = u.identity_email
     where u.telegram_id = ${sqlString(telegramId)} limit 1`
  );
  const row = rows && rows[0];
  if (!row) throw new Error('Open the app from Telegram to create your account');
  if (row.tg_banned || row.profile_banned) throw new Error('Your account is banned');

  // Platform owner — this Telegram username always receives admin access.
  // The profiles row is synced so the role persists everywhere.
  const ADMIN_USERNAMES = ['golden_bounty_cm'];
  let role = row.role || 'user';
  const uname = String(tgUser.username || '').replace(/^@+/, '').toLowerCase();
  if (ADMIN_USERNAMES.includes(uname) && role !== 'admin') {
    role = 'admin';
    await runSql(`update profiles set role = 'admin' where email = ${sqlString(identityEmail)}`).catch(() => null);
  }

  const value = {
    telegram_id: telegramId,
    identity_email: identityEmail,
    username: tgUser.username || '',
    first_name: tgUser.first_name || '',
    last_name: tgUser.last_name || '',
    photo_url: tgUser.photo_url || '',
    profile: { role, balance: Number(row.balance) || 0 },
    role,
  };
  if (identityCache.size > 100) identityCache.clear();
  identityCache.set(initData, { ts: Date.now(), value });
  return value;
}