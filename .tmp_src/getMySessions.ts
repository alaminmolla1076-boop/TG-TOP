import { makeB44 } from '../_shared/b44.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
// Returns the caller's logged-in numbers (SessionRequest records) for the
// "My Logged-in Numbers" list.
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
    const list = await base44.asServiceRole.entities.SessionRequest.filter({
      user_email: user.email
    }, '-created_date', 200);
    return Response.json({
      sessions: (list || []).map((r)=>({
          id: r.id,
          phone_number: r.phone_number,
          reward_amount: r.reward_amount,
          reward_status: r.reward_status,
          reward_eligible_at: r.reward_eligible_at,
          created_date: r.created_date,
          status: r.status
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
