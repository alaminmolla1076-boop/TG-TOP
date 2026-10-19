import { makeB44, secrets } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
// Points the Telegram webhook at this Supabase function so bot updates arrive
// instantly instead of being polled.
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
    const token = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!token) return Response.json({
      error: 'TELEGRAM_BOT_TOKEN not set'
    }, {
      status: 500
    });
    const base = (secrets.get('SUPABASE_URL') || '').replace(/\/$/, '');
    const webhookUrl = `${base}/functions/v1/b44fn/pollTelegramUpdates`;
    const setResult = await (await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: [
          'message',
          'callback_query'
        ],
        drop_pending_updates: true
      })
    })).json();
    const info = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
    return Response.json({
      webhookUrl,
      setResult,
      webhookInfo: info.result
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
