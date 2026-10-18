import { makeB44 } from '../_shared/b44.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
// Returns the caller's top-ups and withdrawals — including the ones created
// from the Telegram bot — keyed on the shared identity email.
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
    const [topups, withdrawals] = await Promise.all([
      base44.asServiceRole.entities.TopUp.filter({
        user_email: user.email
      }, '-created_date', 20),
      base44.asServiceRole.entities.Withdrawal.filter({
        user_email: user.email
      }, '-created_date', 20)
    ]);
    return Response.json({
      topups: (topups || []).map((t)=>({
          id: t.id,
          amount: t.amount,
          coin: t.coin,
          network: t.network,
          tx_hash: t.tx_hash,
          status: t.status,
          created_date: t.created_date
        })),
      withdrawals: (withdrawals || []).map((w)=>({
          id: w.id,
          amount: w.amount,
          wallet_address: w.wallet_address,
          coin: w.coin,
          network: w.network,
          status: w.status,
          created_date: w.created_date
        }))
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
