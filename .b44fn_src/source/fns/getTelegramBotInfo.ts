import { secrets } from '../_shared/b44.ts';
// Returns the bot username so the frontend can deep-link to the bot.
// No auth required — a bot username is public information.
export default async function(_req) {
  try {
    const botToken = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) return Response.json({
      error: 'Bot token not configured'
    }, {
      status: 500
    });
    const data = await (await fetch(`https://api.telegram.org/bot${botToken}/getMe`)).json();
    if (!data.ok) return Response.json({
      error: data.description || 'Telegram API error'
    }, {
      status: 502
    });
    return Response.json({
      username: data.result.username
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
