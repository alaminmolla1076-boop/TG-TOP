import { Mt, history } from './mtproto.js';

// Reads the most recent login/OTP code from a stored Telegram session.
// Telegram sends login codes from the service account (id 777000).
// sinceMs: ignore codes delivered before this moment — codes that predate the
// purchase are the seller's own (already used) login codes and always invalid.
export async function readOtpFromSession(sessionString, sinceMs = 0) {
  const mt = new Mt(sessionString);
  const messages = await history(mt, { _: 'inputPeerUser', user_id: 777000, access_hash: 0 }, 10);
  for (const msg of messages) {
    // History comes newest-first: everything after an older message is older too.
    if (sinceMs && msg?.date && msg.date * 1000 <= sinceMs) break;
    const text = msg?.message || '';
    const code = extractLoginCode(text);
    if (code) return { code, raw: text };
  }
  return null;
}

// Telegram service messages often contain years (e.g. 2026), subscription IDs or
// dates; only an explicitly labeled code wins, and year-like or partial-digit
// numbers are skipped.
export function extractLoginCode(text) {
  if (!text) return null;
  const labeled = text.match(/(?:login\s*code|log\s*in\s*code|verification\s*code|confirmation\s*code|\bc[o\u00f3]de\b)[^0-9]{0,30}(\d{4,8})(?!\d)/i);
  if (labeled && !/^(19|20)\d{2}$/.test(labeled[1])) return labeled[1];
  const runs = text.match(/(?<!\d)\d{4,8}(?!\d)/g) || [];
  for (const run of runs) {
    if (/^(19|20)\d{2}$/.test(run)) continue;
    return run;
  }
  return null;
}