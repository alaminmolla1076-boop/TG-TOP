import { makeB44, secrets } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
// Demotes any User whose role is 'admin' but whose email is not in ADMIN_EMAILS.
// Runs on a schedule and can be triggered manually by an admin.
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
    const authorizedEmails = (secrets.get('ADMIN_EMAILS') || '').split(',').map((e)=>e.trim().toLowerCase()).filter(Boolean);
    if (!authorizedEmails.length) {
      return Response.json({
        error: 'No authorized admin emails configured'
      }, {
        status: 500
      });
    }
    const users = await base44.asServiceRole.entities.User.list();
    const demoted = [];
    const kept = [];
    for (const user of users){
      if (user.role !== 'admin') continue;
      if (authorizedEmails.includes(String(user.email || '').toLowerCase())) {
        kept.push({
          email: user.email,
          reason: 'authorized'
        });
        continue;
      }
      try {
        await base44.asServiceRole.entities.User.update(user.id, {
          role: 'user'
        });
        demoted.push(user.email);
      } catch (updateError) {
        kept.push({
          email: user.email,
          reason: updateError.message
        });
      }
    }
    return Response.json({
      success: true,
      scanned: users.length,
      demoted,
      kept
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
