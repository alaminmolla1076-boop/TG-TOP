import { makeB44 } from '../_shared/b44.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
// Lifetime totals for the caller: logged-in (sold) numbers, rewards credited,
// approved top-ups and approved withdrawals.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json().catch(()=>({}));
    const user = await resolveUser(base44, body);
    if (!user?.email) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const [sessions, topups, withdrawals] = await Promise.all([
      base44.asServiceRole.entities.SessionRequest.filter({
        user_email: user.email,
        status: 'completed'
      }),
      base44.asServiceRole.entities.TopUp.filter({
        user_email: user.email,
        status: 'approved'
      }),
      base44.asServiceRole.entities.Withdrawal.filter({
        user_email: user.email,
        status: 'approved'
      })
    ]);
    const sum = (list, key)=>list.reduce((s, r)=>s + (r[key] || 0), 0);
    return Response.json({
      total_logins: sessions.length,
      total_reward: sum(sessions.filter((s)=>s.reward_status === 'rewarded'), 'reward_amount'),
      total_topup: sum(topups, 'amount'),
      total_withdraw: sum(withdrawals, 'amount')
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
