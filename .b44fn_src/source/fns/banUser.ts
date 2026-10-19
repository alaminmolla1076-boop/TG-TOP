import { makeB44 } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
export default async function(req) {
  try {
    const base44 = makeB44(req);
    if (!await isAdminRequest(base44)) {
      return Response.json({
        error: 'Admin access required'
      }, {
        status: 403
      });
    }
    const body = await req.json();
    const { user_id, banned } = body;
    if (!user_id || typeof banned !== 'boolean') {
      return Response.json({
        error: 'user_id and banned (boolean) required'
      }, {
        status: 400
      });
    }
    // Prevent self-ban
    const me = await base44.auth.me().catch(()=>null);
    if (me && user_id === me.id) {
      return Response.json({
        error: 'Cannot ban yourself'
      }, {
        status: 400
      });
    }
    await base44.asServiceRole.entities.User.update(user_id, {
      banned
    });
    return Response.json({
      success: true,
      user_id,
      banned
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
