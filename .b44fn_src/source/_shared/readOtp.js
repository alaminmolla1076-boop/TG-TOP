import { Mt, history } from './mtproto.js';

// Reads the most recent login/OTP code from a stored Telegram session.
// Telegram sends login codes from the service account (id 777000).
export async function readOtpFromSession(sessionString) {
  const mt = new Mt(sessionString);
  const messages = await history(mt, { _: 'inputPeerUser', user_id: 777000, access_hash: 0 }, 10);
  for (const msg of messages) {
    const text = msg?.message || '';
    const match = text.match(/\b(\d{4,8})\b/);
    if (match) return { code: match[1], raw: text };
  }
  return null;
}