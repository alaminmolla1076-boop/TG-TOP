import { makeB44 } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
import { Mt, errorMessageOf } from '../_shared/mtproto.js';
import { admin, entities } from '../_shared/entities.ts';
import { syncCountryStock } from '../_shared/inventory.js';

// Scheduled stock sweep: only numbers whose session is still logged in on our
// system may stay sellable. Each pass re-verifies a slice of the available
// inventory (oldest-checked first); an account whose session was terminated
// from the account side — or that got deactivated — is pulled out of stock
// (status 'terminated') right away, so buyers can never receive it.
const PAGE = 60;
const CONCURRENCY = 4;
const BUDGET_MS = 150000;
// Telegram errors that mean the stored session can never authorize again.
const DEAD_SESSION = /AUTH_KEY_UNREGISTERED|AUTH_KEY_INVALID|AUTH_KEY_DUPLICATED|SESSION_REVOKED|SESSION_EXPIRED|USER_DEACTIVATED/i;

export default async function (req) {
  try {
    const base44 = makeB44(req);
    // Public endpoint on Supabase — only the scheduler or an admin may run it.
    if (!await isAdminRequest(base44)) {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }
    const startedAt = Date.now();

    // Oldest-checked first: never-verified accounts get priority, then the
    // least-recently verified ones, so the whole stock cycles fairly.
    const select = 'id, country_iso, phone_number, session_string, session_checked_at';
    const unchecked = await admin.from('tg_accounts').select(select)
      .eq('status', 'available').is('session_checked_at', null).limit(PAGE);
    if (unchecked.error) throw new Error(unchecked.error.message);
    let batch = unchecked.data || [];
    if (batch.length < PAGE) {
      const oldest = await admin.from('tg_accounts').select(select)
        .eq('status', 'available').not('session_checked_at', 'is', null)
        .order('session_checked_at', { ascending: true }).limit(PAGE - batch.length);
      if (oldest.error) throw new Error(oldest.error.message);
      batch = batch.concat(oldest.data || []);
    }

    const aliveIds = [];
    const deadAccounts = [];
    const skippedIds = [];
    let cursor = 0;
    const checkOne = async () => {
      while (cursor < batch.length && Date.now() - startedAt < BUDGET_MS) {
        const acc = batch[cursor++];
        const mt = new Mt(acc.session_string);
        let verdict;
        try {
          await mt.call('users.getUsers', { id: [{ _: 'inputUserSelf' }] });
          verdict = { alive: true };
        } catch (e) {
          const msg = errorMessageOf(e);
          if (DEAD_SESSION.test(msg)) verdict = { dead: true, reason: msg };
          // Transport hiccups and unknown errors never touch stock — the
          // account keeps its place and is simply re-checked next pass.
          else verdict = { skip: true, reason: msg };
        } finally {
          try { mt.close(); } catch { /* best-effort */ }
        }
        if (verdict.alive) aliveIds.push(acc.id);
        else if (verdict.dead) deadAccounts.push(acc);
        else skippedIds.push(acc.id);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) || 1 }, checkOne));

    const checkedAt = new Date().toISOString();
    if (aliveIds.length) {
      await entities.TgAccount.bulkUpdate(aliveIds.map((id) => ({ id, session_checked_at: checkedAt })));
    }
    if (deadAccounts.length) {
      await entities.TgAccount.bulkUpdate(
        deadAccounts.map((acc) => ({ id: acc.id, status: 'terminated', session_checked_at: checkedAt }))
      );
    }
    // Country stock counters only change for the countries that lost accounts.
    const countries = [...new Set(deadAccounts.map((a) => a.country_iso).filter(Boolean))];
    for (const iso of countries) {
      await syncCountryStock(base44, iso).catch((e) => console.error('Stock sync failed for', iso, e?.message));
    }

    return Response.json({
      processed: batch.length,
      alive: aliveIds.length,
      terminated: deadAccounts.length,
      skipped: skippedIds.length,
      out_of_time: Date.now() - startedAt >= BUDGET_MS,
      countries_synced: countries
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
}