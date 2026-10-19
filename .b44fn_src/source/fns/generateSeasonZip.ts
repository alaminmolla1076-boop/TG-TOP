import { makeB44, secrets } from '../_shared/b44.ts';
import { StringSession } from 'npm:telegram@2.26.22/sessions/index.js';
import { createZip } from '../_shared/zipBuilder.js';
import { buildSessionFile } from '../_shared/sqliteBuilder.js';
import { resolveUser } from '../_shared/resolveUser.ts';
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json();
    const user = await resolveUser(base44, body);
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const adminEmails = (Deno.env.get('ADMIN_EMAILS') || '').split(',').map((e)=>e.trim().toLowerCase()).filter(Boolean);
    const isAdmin = user.role === 'admin' || adminEmails.includes((user.email || '').toLowerCase()) || user.is_owner === true;
    const { account_ids } = body;
    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      return Response.json({
        error: 'account_ids required'
      }, {
        status: 400
      });
    }
    // Session files are tiny, so one ZIP holds a whole season. Only the DB
    // read is chunked (200 ids per query).
    if (account_ids.length > 3000) {
      return Response.json({
        error: 'Too many accounts for one ZIP — request 3000 or fewer per file.'
      }, {
        status: 400
      });
    }
    const files = [];
    const accounts = [];
    for(let i = 0; i < account_ids.length; i += 200){
      const part = await base44.asServiceRole.entities.TgAccount.filter({
        id: {
          $in: account_ids.slice(i, i + 200)
        }
      });
      accounts.push(...part);
    }
    for (const acc of accounts){
      if (!acc) continue;
      if (acc.owner_email !== user.email && !isAdmin) continue;
      if (!acc.session_string) continue;
      const session = new StringSession(acc.session_string);
      // GramJS keeps the raw auth key in _key; the authKey getter needs load().
      const authKeyBytes = session._key || new Uint8Array([]);
      files.push({
        name: `${acc.phone_number}.session`,
        data: buildSessionFile({
          authKey: authKeyBytes,
          dcId: session.dcId || 0,
          port: session.port || 443,
          serverAddress: session.serverAddress || ''
        })
      });
    }
    if (files.length === 0) {
      return Response.json({
        error: 'No valid sessions found'
      }, {
        status: 400
      });
    }
    const sessionCount = files.length;
    const zipFile = new File([
      createZip(files)
    ], `sessions_${sessionCount}.zip`, {
      type: 'application/zip'
    });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
      file: zipFile
    });
    // Deliver the ZIP straight to the user's Telegram chat.
    let telegram_sent = false;
    let telegram_error = null;
    const idMatch = /^tg(\d+)@telegram\.local$/i.exec(user.email || '');
    const telegramId = user.telegram_id || (idMatch ? idMatch[1] : null);
    const botToken = secrets.get('TELEGRAM_BOT_TOKEN');
    if (telegramId && botToken) {
      try {
        const formData = new FormData();
        formData.append('chat_id', String(telegramId));
        formData.append('document', zipFile, `sessions_${sessionCount}.zip`);
        formData.append('caption', `📦 ${sessionCount} session file${sessionCount > 1 ? 's' : ''} — TG Top`);
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
          method: 'POST',
          body: formData
        });
        const tgData = await tgRes.json();
        if (tgData.ok) telegram_sent = true;
        else telegram_error = tgData.description || 'Telegram API error';
      } catch (e) {
        telegram_error = e.message || String(e);
      }
    } else {
      telegram_error = telegramId ? 'Bot token not configured' : 'Telegram account not bound';
    }
    return Response.json({
      success: true,
      file_url,
      count: sessionCount,
      telegram_sent,
      telegram_error
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}