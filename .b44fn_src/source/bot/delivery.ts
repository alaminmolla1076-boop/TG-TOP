import { t } from '../_shared/botTranslations.js';
import { tgSend, tgSendDoc } from '../_shared/telegramApi.ts';
import { createZip } from '../_shared/zipBuilder.js';
import { buildSessionFile } from '../_shared/sqliteBuilder.js';
import { setState } from './state.ts';
// The `telegram` library is multi-megabyte; loading it lazily keeps normal bot
// replies (menus, balance, orders) off the slow cold-start path.
const loadStringSession = async ()=>(await import('npm:telegram@2.26.22/sessions/index.js')).StringSession;
// Backend functions return their reason in the JSON body — surface that instead
// of a generic HTTP error.
export function errText(err) {
  return err?.response?.data?.error || err?.message || 'Unknown error';
}
// Delivers ALL purchased sessions as ONE ZIP, whatever the season size — session
// files are a few hundred bytes each. Only the DB read is chunked (200/query).
export async function deliverSeasonZip(base44, token, chatId, accountIds, replyTo) {
  const files = [];
  const StringSession = await loadStringSession();
  for(let i = 0; i < accountIds.length; i += 200){
    const accounts = await base44.asServiceRole.entities.TgAccount.filter({
      id: {
        $in: accountIds.slice(i, i + 200)
      }
    });
    for (const acc of accounts){
      if (!acc || !acc.session_string) continue;
      const session = new StringSession(acc.session_string);
      files.push({
        name: `${acc.phone_number}.session`,
        data: buildSessionFile({
          authKey: session._key || new Uint8Array([]),
          dcId: session.dcId || 0,
          port: session.port || 443,
          serverAddress: session.serverAddress || ''
        })
      });
    }
  }
  let sent = 0;
  if (files.length) {
    const zipFile = new File([
      createZip(files)
    ], `sessions_${files.length}.zip`, {
      type: 'application/zip'
    });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
      file: zipFile
    });
    const delivery = await tgSendDoc(token, chatId, file_url, `📦 ${files.length} session file${files.length > 1 ? 's' : ''} — TG Top`);
    if (!delivery.ok) throw new Error(delivery.description || 'Session ZIP delivery failed');
    sent = files.length;
  }
  if (!sent) await tgSend(token, chatId, '❌ No valid sessions to deliver.', replyTo);
  return sent;
}
// Generates a bind code so an app account can be linked to this Telegram user.
export async function handleBind(base44, token, chatId, telegramUser, lang, findUserByTelegramId) {
  const L = lang || 'en';
  const tgId = String(telegramUser.id);
  const tgUsername = telegramUser.username || '';
  const existing = await findUserByTelegramId(base44, tgId);
  if (existing) {
    await tgSend(token, chatId, t(L, 'bind.alreadyLinked', {
      email: existing.email,
      username: tgUsername || tgId
    }));
    return;
  }
  const code = Math.floor(100000 + Math.random() * 900000);
  await setState(base44, `bind:${tgId}`, JSON.stringify({
    code,
    username: tgUsername,
    created: Date.now()
  }));
  await tgSend(token, chatId, `${t(L, 'bind.title')}\n\n${t(L, 'bind.code')} <code>${code}</code>\n\n${t(L, 'bind.instructions')}\n\n${t(L, 'bind.expires')}`);
}
// Admin: build and send a season ZIP for one country.
export async function handleSeasonGen(base44, token, chatId, text) {
  const iso = text.split(/\s+/)[1]?.toUpperCase();
  if (!iso) {
    const countries = await base44.asServiceRole.entities.Country.filter({
      active: true,
      platform: 'tg'
    });
    const list = countries.map((c)=>`${c.flag} ${c.iso} — ${c.name}`).join('\n');
    await tgSend(token, chatId, `📦 <b>Season ZIP Generator</b>\n\nUsage: <code>/season_gen US</code>\n\nAvailable countries:\n${list}`);
    return;
  }
  const country = (await base44.asServiceRole.entities.Country.filter({
    iso,
    active: true
  }))[0];
  if (!country) {
    await tgSend(token, chatId, `❌ Country ${iso} not found.`);
    return;
  }
  await tgSend(token, chatId, `📦 Generating season ZIP for ${country.flag} ${country.name}...`);
  try {
    const result = await base44.asServiceRole.functions.invoke('generateSeasonZip', {
      country_iso: iso
    });
    const data = result.data || result;
    if (data.error) throw new Error(data.error);
    if (data.zip_url) await tgSendDoc(token, chatId, data.zip_url, `📦 Season ZIP for ${country.name} (${country.iso})`);
    else await tgSend(token, chatId, `✅ ZIP generated: ${data.zip_url || data.message || 'Done'}`);
  } catch (err) {
    await tgSend(token, chatId, `❌ Error: ${err.message}`);
  }
}
// Sell Season for pasted session strings: one sellSeason call per session so a
// single call never exceeds the timeout, with per-session progress in chat.
export async function processSellSeasonBulk(base44, token, chatId, sessions, userEmail, lang, replyTo) {
  let totalAdded = 0, totalFailed = 0, totalReward = 0;
  const addedByCountry = {};
  const failedReasons = {};
  for(let i = 0; i < sessions.length; i++){
    const result = await base44.asServiceRole.functions.invoke('sellSeason', {
      sessions: [
        sessions[i]
      ],
      user_email: userEmail
    });
    const data = result.data || result;
    if (data.error) throw new Error(data.error);
    totalAdded += data.added || 0;
    totalFailed += data.failed || 0;
    totalReward += data.total_reward || 0;
    const done = i + 1;
    if (data.added) {
      await tgSend(token, chatId, `✅ Session ${done}/${sessions.length} — added${data.results?.[0]?.country ? ` (${data.results[0].country})` : ''}`, replyTo);
    } else if (data.failed) {
      await tgSend(token, chatId, `❌ Session ${done}/${sessions.length} — ${data.failed_details?.[0]?.reason || 'failed'}`, replyTo);
    }
    for (const [iso, count] of Object.entries(data.added_by_country || {})){
      addedByCountry[iso] = (addedByCountry[iso] || 0) + count;
    }
    for (const f of data.failed_details || []){
      const reason = f.reason || 'Unknown';
      failedReasons[reason] = (failedReasons[reason] || 0) + 1;
    }
    // Recovery file per session so bad accounts can be recovered immediately.
    if (data.failed_file_url) {
      await tgSendDoc(token, chatId, data.failed_file_url, `❌ Batch ${done} failed sessions (${data.failed || 0}) — recovery file`);
    }
  }
  let msg = `${t(lang, 'sell.seasonDone')}\n\n`;
  msg += `${t(lang, 'sell.seasonAdded', {
    added: totalAdded
  })}\n`;
  msg += `${t(lang, 'sell.seasonFailed', {
    failed: totalFailed
  })}\n`;
  if (totalReward) msg += `${t(lang, 'sell.seasonReward', {
    reward: totalReward.toFixed(2)
  })}\n`;
  if (Object.keys(addedByCountry).length) {
    msg += `\n🌍 <b>By country:</b>\n`;
    for (const [iso, count] of Object.entries(addedByCountry))msg += `• ${iso}: ${count}\n`;
  }
  if (Object.keys(failedReasons).length) {
    msg += `\n❌ <b>Failed breakdown:</b>\n`;
    for (const [reason, count] of Object.entries(failedReasons))msg += `• ${reason}: ${count}\n`;
  }
  await tgSend(token, chatId, msg, replyTo);
}
