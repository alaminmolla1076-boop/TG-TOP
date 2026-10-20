// Interacts with @SpamBot to determine whether a logged-in Telegram account is
// clean (no limits) or flagged (limits applied / frozen).
import { resolvePeer, sendText, history } from './mtproto.js';

const SPAM_BOT = 'SpamBot';

const CLEAN_KEYWORDS = [
  'Good news, no limits are currently applied',
  "You're free as a bird",
];

const REJECTED_KEYWORDS = [
  'Unfortunately, this is not possible',
  "can't guarantee our users' safety",
  'should this account be released again',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Returns { status: 'clean' | 'rejected', text } based on SpamBot's reply.
// FIX: the old version slept a fixed 1.5s and classified the last 5 chat
// messages. If the fresh reply was late (or a previous owner had once gotten
// a "no limits" answer), stale history made spam accounts pass as clean.
// Now only the NEW @SpamBot reply that arrives AFTER our /start is used,
// and anything unconfirmed/unknown stays rejected (safe default).
export async function checkSpamBotStatus(mt) {
  let peer;
  try {
    peer = await resolvePeer(mt, SPAM_BOT);
  } catch (e) {
    // If we can't even message SpamBot, treat as rejected (safe default).
    return { status: 'rejected', text: '', error: e.message };
  }

  // Remember the newest message already in the chat, so only messages that
  // arrive after our /start are ever classified.
  let baselineId = 0;
  try {
    const prior = await history(mt, peer, 1);
    for (const m of prior) baselineId = Math.max(baselineId, Number(m.id) || 0);
  } catch { /* unreadable history — baseline 0 still excludes nothing extra */ }

  try {
    await sendText(mt, peer, '/start');
  } catch (e) {
    return { status: 'rejected', text: '', error: e.message };
  }

  // Poll up to ~9s for SpamBot's fresh inbound reply (our own /start is
  // skipped via m.out).
  const deadline = Date.now() + 9000;
  let text = '';
  let lastError = null;
  while (Date.now() < deadline) {
    await sleep(1200);
    try {
      const messages = await history(mt, peer, 5);
      const fresh = messages.filter((m) => (Number(m.id) || 0) > baselineId && !m.out);
      if (fresh.length) {
        text = fresh.map((m) => m.message || '').join('\n');
        break;
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (!text) {
    return { status: 'rejected', text: '', error: lastError ? lastError.message : 'No reply from SpamBot' };
  }

  const isClean = CLEAN_KEYWORDS.some((kw) => text.includes(kw));
  const isRejected = REJECTED_KEYWORDS.some((kw) => text.includes(kw));

  if (isClean && !isRejected) return { status: 'clean', text };
  return { status: 'rejected', text };
}