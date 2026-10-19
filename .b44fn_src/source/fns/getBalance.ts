import { makeB44 } from '../_shared/b44.ts';
import { syncUserBalance } from '../_shared/balance.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
// Returns the authoritative balance computed from source-of-truth records
// (approved TopUps minus completed purchases and pending/approved withdrawals).
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json().catch(()=>({}));
    const user = await resolveUser(base44, body);
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const realBalance = await syncUserBalance(base44, user.email);
    return Response.json({
      balance: realBalance
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
