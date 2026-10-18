import { makeB44 } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
import { Mt } from '../_shared/mtproto.js';
import { checkSpamBotStatus } from '../_shared/spamBot.js';
import { creditSessionReward } from '../_shared/balance.ts';
import { notifyUser } from '../_shared/adminNotify.ts';
import { ACCEPTED_COUNTRIES } from '../_shared/acceptedCountries.js';
// Country name + flag for a session's ISO: RewardPrice record first, then the
// accepted-countries list.
async function getCountryInfo(base44, iso) {
  let name = iso || '';
  let flag = '';
  try {
    const dbPrices = await base44.asServiceRole.entities.RewardPrice.filter({
      country_iso: iso
    });
    if (dbPrices.length > 0) {
      if (dbPrices[0].country_name) name = dbPrices[0].country_name;
      if (dbPrices[0].flag) flag = dbPrices[0].flag;
    }
  } catch (e) {}
  if (!flag) {
    const found = ACCEPTED_COUNTRIES.find((c)=>c.iso === iso);
    if (found) flag = found.flag || '';
  }
  return {
    name,
    flag
  };
}
// Scheduled reward sweep.
//   1. Already-sold accounts skip every check — the reward is honored.
//   2. Window still open → SILENT liveness check (no @SpamBot message). A dead,
//      banned or revoked session → 'frozen' + removed from stock right away.
//   3. Window ended → one @SpamBot check; flagged/frozen/unusable → 'frozen',
//      no credit, and the account is pulled out of the sellable stock.
//   4. Window ended + clean → credited + 'rewarded'.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    // Public endpoint on Supabase — only the scheduler or an admin may run it.
    if (!await isAdminRequest(base44)) {
      return Response.json({
        error: 'Admin only'
      }, {
        status: 403
      });
    }
    const pendingSessions = await base44.asServiceRole.entities.SessionRequest.filter({
      status: 'completed',
      reward_status: 'pending'
    });
    const now = new Date();
    let credited = 0;
    let frozen = 0;
    let skipped = 0;
    // A broken/flagged account must leave the sellable stock so no buyer can
    // ever receive it (a sold account is never touched here).
    const removeFromStock = async (session)=>{
      if (!session.account_id) return;
      try {
        const accs = await base44.asServiceRole.entities.TgAccount.filter({
          id: session.account_id
        });
        if (accs[0] && accs[0].status !== 'sold') {
          await base44.asServiceRole.entities.TgAccount.delete(session.account_id);
        }
      } catch (e) {}
    };
    const freeze = async (session)=>{
      await removeFromStock(session);
      await base44.asServiceRole.entities.SessionRequest.update(session.id, {
        reward_status: 'frozen'
      });
      await notifyUser(base44, session.user_email, `❌ <b>Reward not Credited</b>\n\nStatus: Frozen\nNumber: ${session.phone_number}`);
      frozen++;
    };
    const credit = async (session)=>{
      await creditSessionReward(base44, session.user_email, session.reward_amount || 0);
      await base44.asServiceRole.entities.SessionRequest.update(session.id, {
        reward_status: 'rewarded'
      });
      const cInfo = await getCountryInfo(base44, session.country_iso);
      await notifyUser(base44, session.user_email, `✅ <b>Reward Credited</b>\n\nAmount: $${(session.reward_amount || 0).toFixed(2)}\nCountry: ${cInfo.flag} ${cInfo.name}\nNumber: ${session.phone_number}`);
      credited++;
    };
    for (const session of pendingSessions){
      const eligibleAt = session.reward_eligible_at ? new Date(session.reward_eligible_at) : null;
      const windowExpired = !!(eligibleAt && eligibleAt <= now);
      try {
        // A sold account's reward is honored on schedule regardless of the
        // session's current state.
        if (session.account_id) {
          const accs = await base44.asServiceRole.entities.TgAccount.filter({
            id: session.account_id
          });
          const acc = accs[0];
          if (acc && acc.status === 'sold') {
            if (windowExpired) await credit(session);
            else skipped++;
            continue;
          }
        }
        if (!session.session_string) {
          await freeze(session);
          continue;
        }
        // Still inside the waiting window: verify the account is alive WITHOUT
        // messaging @SpamBot. A dead/banned/revoked session is frozen and
        // pulled from stock immediately instead of waiting for the window.
        if (!windowExpired) {
          const alive = await new Mt(session.session_string).isAuthorized();
          if (!alive) await freeze(session);
          else skipped++;
          continue;
        }
        // Single end-of-window verification: broken/frozen/flagged → no credit.
        const mt = new Mt(session.session_string);
        const spamCheck = await checkSpamBotStatus(mt);
        if (spamCheck.status !== 'clean') {
          await freeze(session);
          continue;
        }
        await credit(session);
      } catch (e) {
        if (windowExpired) await freeze(session);
        else skipped++;
      }
    }
    return Response.json({
      processed: pendingSessions.length,
      credited,
      frozen,
      skipped
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
