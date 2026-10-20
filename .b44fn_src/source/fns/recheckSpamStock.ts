import { makeB44 } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
import { Mt } from '../_shared/mtproto.js';
import { admin, entities } from '../_shared/entities.ts';
import { checkSpamBotStatus } from '../_shared/spamBot.js';

// Daily @SpamBot sweep. Accounts were filed into the Spam or Non-Spam pool when
// the seller added them; this pass re-checks the SPAM ones once a day, and an
// account that @SpamBot has since released moves into the Non-Spam stock at
// the seller's non-spam price for that country. Nothing else changes — a
// still-flagged account simply stays in the spam pool.
const PAGE = 30;
const CONCURRENCY = 3;
const BUDGET_MS = 150000;

export default async function(req) {
  try {
    const base44 = makeB44(req);
    // Public endpoint on Supabase — only the scheduler or an admin may run it.
    if (!await isAdminRequest(base44)) {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }
    const startedAt = Date.now();

    // Idempotent bootstrap of the per-account spam check timestamp.
    const guard = await admin.rpc('exec_json', { q: 'alter table tg_accounts add column if not exists spam_checked_at timestamptz' });
    if (guard.error) throw new Error(guard.error.message);

    // Oldest-checked first, so the whole spam stock cycles fairly across days.
    const select = 'id, country_iso, phone_number, price, session_string, owner_email, spam_checked_at';
    const unchecked = await admin.from('tg_accounts').select(select)
      .eq('status', 'available').eq('spam', true).is('spam_checked_at', null).limit(PAGE);
    if (unchecked.error) throw new Error(unchecked.error.message);
    let batch = unchecked.data || [];
    if (batch.length < PAGE) {
      const oldest = await admin.from('tg_accounts').select(select)
        .eq('status', 'available').eq('spam', true).not('spam_checked_at', 'is', null)
        .order('spam_checked_at', { ascending: true }).limit(PAGE - batch.length);
      if (oldest.error) throw new Error(oldest.error.message);
      batch = batch.concat(oldest.data || []);
    }

    // The non-spam price a promoted account switches to: the pool price the
    // seller set first, then the cheapest of their other non-spam numbers of
    // that country — else the account keeps its current price until the seller
    // sets one on the Sell page.
    const nonSpamPrice = async (acc)=>{
      // Age-aware: prefer the price stored for this account's age bucket,
      // then the pool-wide ('') one, then any stored non-spam price.
      const stored = await admin.from('stock_prices').select('price, age_category')
        .eq('owner_email', acc.owner_email).eq('country_iso', acc.country_iso)
        .eq('spam', false);
      const storedRows = stored.error ? [] : (stored.data || []);
      const accAge = acc.age_category || 'regular';
      const match = storedRows.find((r) => r.age_category === accAge)
        || storedRows.find((r) => !r.age_category)
        || storedRows.find((r) => Number(r.price) > 0);
      if (match && Number(match.price) > 0) {
        return Number(match.price);
      }
      const peers = await admin.from('tg_accounts').select('price')
        .eq('owner_email', acc.owner_email).eq('country_iso', acc.country_iso)
        .eq('status', 'available').eq('spam', false).not('price', 'is', null)
        .order('price', { ascending: true }).limit(1);
      if (!peers.error && peers.data && peers.data.length && Number(peers.data[0].price) > 0) {
        return Number(peers.data[0].price);
      }
      return null;
    };

    const now = ()=>new Date().toISOString();
    const promote = async (acc)=>{
      const price = await nonSpamPrice(acc);
      const changes = { spam: false, spam_checked_at: now() };
      if (price != null) changes.price = Number(price.toFixed(2));
      await entities.TgAccount.update(acc.id, changes);
    };

    let promoted = 0;
    let stillSpam = 0;
    let skipped = 0;
    let cursor = 0;
    const checkOne = async ()=>{
      while (cursor < batch.length && Date.now() - startedAt < BUDGET_MS) {
        const acc = batch[cursor++];
        const mt = new Mt(acc.session_string);
        try {
          const spamCheck = await checkSpamBotStatus(mt);
          if (spamCheck.status === 'clean') {
            await promote(acc);
            promoted++;
          } else {
            // Confirmed spam — stays in the pool, just record the check time.
            await entities.TgAccount.update(acc.id, { spam_checked_at: now() });
            stillSpam++;
          }
        } catch (e) {
          // Unknown/transport error: leave the account unchecked so the next
          // daily pass retries it — never move an account on a failed check.
          skipped++;
        } finally {
          try { mt.close(); } catch { /* best-effort */ }
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) || 1 }, checkOne));

    return Response.json({
      processed: batch.length,
      promoted,
      still_spam: stillSpam,
      skipped,
      out_of_time: Date.now() - startedAt >= BUDGET_MS
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}