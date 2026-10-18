import { makeB44, secrets } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
import { tgSend } from '../_shared/telegramApi.ts';
// Admin messaging: one private message, or a broadcast to every linked user.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const token = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!token) return Response.json({
      error: 'TELEGRAM_BOT_TOKEN not set'
    }, {
      status: 500
    });
    const { target_type, telegram_id, message } = await req.json().catch(()=>({}));
    if (!message || !String(message).trim()) {
      return Response.json({
        error: 'Message text is required'
      }, {
        status: 400
      });
    }
    if (!await isAdminRequest(base44)) {
      return Response.json({
        error: 'Admin access required'
      }, {
        status: 403
      });
    }
    const text = String(message).trim();
    if (target_type === 'private') {
      if (!telegram_id) {
        return Response.json({
          error: 'telegram_id is required for private messages'
        }, {
          status: 400
        });
      }
      const result = await tgSend(token, String(telegram_id), text);
      if (!result.ok) {
        return Response.json({
          error: result.description || 'Failed to send message'
        }, {
          status: 400
        });
      }
      return Response.json({
        ok: true,
        sent: 1,
        failed: 0
      });
    }
    if (target_type === 'broadcast') {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
      const withTg = users.filter((u)=>u.telegram_id && !u.banned);
      let sent = 0, failed = 0;
      const failedList = [];
      for (const u of withTg){
        try {
          const r = await tgSend(token, String(u.telegram_id), text);
          if (r.ok) sent++;
          else {
            failed++;
            failedList.push({
              email: u.email,
              telegram_id: u.telegram_id,
              error: r.description
            });
          }
        } catch (e) {
          failed++;
          failedList.push({
            email: u.email,
            telegram_id: u.telegram_id,
            error: e.message
          });
        }
        // Small delay to stay under Telegram's ~30 msg/sec limit.
        await new Promise((res)=>setTimeout(res, 40));
      }
      return Response.json({
        ok: true,
        sent,
        failed,
        total: withTg.length,
        failed_details: failedList.slice(0, 20)
      });
    }
    return Response.json({
      error: 'Invalid target_type. Use "private" or "broadcast".'
    }, {
      status: 400
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
