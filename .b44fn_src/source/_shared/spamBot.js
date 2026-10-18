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
export async function checkSpamBotStatus(mt) {
  let peer;
  try {
    peer = await resolvePeer(mt, SPAM_BOT);
    await sendText(mt, peer, '/start');
  } catch (e) {
    // If we can't even message SpamBot, treat as rejected (safe default).
    return { status: 'rejected', text: '', error: e.message };
  }

  await sleep(1500);

  let text = '';
  try {
    const messages = await history(mt, peer, 5);
    text = messages.map((m) => m.message || '').join('\n');
  } catch (e) {
    return { status: 'rejected', text: '', error: e.message };
  }

  const isClean = CLEAN_KEYWORDS.some((kw) => text.includes(kw));
  const isRejected = REJECTED_KEYWORDS.some((kw) => text.includes(kw));

  if (isClean && !isRejected) return { status: 'clean', text };
  return { status: 'rejected', text };
}