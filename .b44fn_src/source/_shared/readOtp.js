import { Mt, history } from './mtproto.js';

// Reads the most recent login/OTP code from a stored Telegram session.
// Telegram sends login codes from the service account (id 777000).
export async function readOtpFromSession(sessionString) {
  const mt = new Mt(sessionString);
  const messages = await history(mt, { _: 'inputPeerUser', user_id: 777000, access_hash: 0 }, 10);
  for (const msg of messages) {
    const text = msg?.message || '';
    const code = extractLoginCode(text);
    if (code) return { code, raw: text };
  }
  return null;
}

// Telegram service messages often contain years (e.g. 2026), subscription IDs or
// dates; only an explicitly labeled code wins, and standalone years are skipped.
export function extractLoginCode(text) {
  if (!text) return null;
  const labeled = text.match(/(?:login\s*code|log\s*in\s*code|verification\s*code|confirmation\s*code|\bc[o\u00f3]de\b)[^0-9]{0,30}(\d{4,8})/i);
  if (labeled && !/^(19|20)\d{2}$/.test(labeled[1])) return labeled[1];
  const runs = text.match(/\d{4,8}/g) || [];
  for (const run of runs) {
    if (/^(19|20)\d{2}$/.test(run)) continue;
    return run;
  }
  return null;
}
