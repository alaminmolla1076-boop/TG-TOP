// Resolves the current user from either an explicit user_email (bot context)
// or the verified Telegram identity (app context).
// Direct port of base44/shared/resolveUser.js.
//
// NOTE: `user_email` is only honoured for in-process calls from another backend
// function (the bot). A public caller cannot name someone else's identity.
const TG_IDENTITY = /^tg(\d+)@telegram\.local$/i;
export async function resolveUser(base44, body) {
  if (body && body.user_email && base44.__internal) {
    const email = String(body.user_email).trim();
    const m = TG_IDENTITY.exec(email);
    if (m) {
      const linked = await base44.asServiceRole.entities.User.filter({
        telegram_id: m[1]
      });
      return {
        ...linked[0] || {},
        telegram_id: m[1],
        email
      };
    }
    const users = await base44.asServiceRole.entities.User.filter({
      email
    });
    return users[0] || null;
  }
  try {
    return await base44.auth.me();
  } catch  {
    return null;
  }
}
