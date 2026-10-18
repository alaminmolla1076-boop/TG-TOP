import { makeB44 } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
// Admin-only edit of a reward country's price, wait time and active flag.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    if (!await isAdminRequest(base44)) {
      return Response.json({
        error: 'Forbidden'
      }, {
        status: 403
      });
    }
    const { id, data } = await req.json().catch(()=>({}));
    if (!id || !data || typeof data !== 'object') {
      return Response.json({
        error: 'id and data required'
      }, {
        status: 400
      });
    }
    // Only these fields may be changed from the admin UI.
    const update = {};
    if (data.active !== undefined) update.active = Boolean(data.active);
    if (data.reward_price !== undefined) update.reward_price = Number(data.reward_price);
    if (data.reward_wait_hours !== undefined) update.reward_wait_hours = Number(data.reward_wait_hours);
    const record = await base44.asServiceRole.entities.RewardPrice.update(id, update);
    return Response.json({
      ok: true,
      record
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
