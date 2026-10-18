import { makeB44, secrets } from '../_shared/b44.ts';
import { verifyInitData, identityEmail } from '../_shared/tgIdentity.ts';
import { getRealBalance } from '../_shared/balance.ts';
// Public endpoint — intentionally callable without an app-user session.
// Authenticity comes from the Telegram signature inside `init_data`, verified
// against the bot token before anything is read or written.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json().catch(()=>({}));
    const initData = body?.init_data;
    const botToken = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) return Response.json({
      error: 'TELEGRAM_BOT_TOKEN not configured'
    }, {
      status: 500
    });
    const tgUser = await verifyInitData(initData, botToken);
    if (!tgUser) return Response.json({
      error: 'Invalid or expired Telegram signature'
    }, {
      status: 401
    });
    const telegramId = String(tgUser.id);
    const email = identityEmail(telegramId);
    const profileData = {
      telegram_id: telegramId,
      identity_email: email,
      telegram_username: tgUser.username || '',
      telegram_first_name: tgUser.first_name || '',
      telegram_last_name: tgUser.last_name || '',
      photo_url: tgUser.photo_url || '',
      language_code: tgUser.language_code || '',
      last_seen: new Date().toISOString()
    };
    const existing = await base44.asServiceRole.entities.TgWebUser.filter({
      telegram_id: telegramId
    });
    let profile = existing[0];
    if (profile) {
      await base44.asServiceRole.entities.TgWebUser.update(profile.id, profileData);
      profile = {
        ...profile,
        ...profileData
      };
    } else {
      profile = await base44.asServiceRole.entities.TgWebUser.create({
        ...profileData,
        banned: false
      });
    }
    if (profile?.banned) {
      return Response.json({
        error: 'This account has been suspended.',
        banned: true
      }, {
        status: 403
      });
    }
    const balance = await getRealBalance(base44, email);
    return Response.json({
      success: true,
      identity_email: email,
      telegram_id: telegramId,
      username: profileData.telegram_username,
      first_name: profileData.telegram_first_name,
      last_name: profileData.telegram_last_name,
      photo_url: profileData.photo_url,
      balance
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
