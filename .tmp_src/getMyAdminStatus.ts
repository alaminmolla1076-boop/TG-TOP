import { makeB44 } from '../_shared/b44.ts';
// Tells the frontend whether the current visitor may open the admin area.
// Admin status is resolved inside the identity layer (ADMIN_TELEGRAM_IDS,
// ADMIN_EMAILS, or a linked User row with role 'admin').
export default async function(req) {
  try {
    const base44 = makeB44(req);
    let me = null;
    try {
      me = await base44.auth.me();
    } catch  {
      me = null;
    }
    if (!me) return Response.json({
      isAdmin: false
    }, {
      status: 401
    });
    return Response.json({
      isAdmin: me.role === 'admin',
      email: me.login_email || me.email,
      role: me.role
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      isAdmin: false
    }, {
      status: 500
    });
  }
}
