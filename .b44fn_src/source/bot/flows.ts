import { t } from '../_shared/botTranslations.js';
import { tgSend, tgSendMenu, tgDeleteMessage, tgSendDoc, tgDownloadFileBytes } from '../_shared/telegramApi.ts';
import { getRealBalance } from '../_shared/balance.ts';
import { extractSessionsFromFile } from '../_shared/extractSessions.js';
import { waitUntil } from '../_shared/b44.ts';
import { selfTrigger } from '../_shared/selfInvoke.ts';
import { getState, setState, clearState, getUserContext, findUserByTelegramId } from './state.ts';
import { buildCountryKeyboard } from './keyboards.ts';
import { showMarketConfirm } from './market.ts';
import { topupMethodView } from './topup.ts';
import { processSellSeasonBulk } from './delivery.ts';
// Stateful conversation flows of the bot (file upload, top-up, withdraw, season
// quantity, sell, admin upload). Each handler returns true when it consumed the
// message, so the command switch is skipped.
const REJECT_REASONS = {
  country_not_accepted: 'Country not accepted',
  country_capacity_full: '📦 This Country Capacity is full. Try Again After Some Time',
  spambot_flagged: '🛡️ Account flagged by SpamBot',
  existing_2fa: 'Account already has 2FA password'
};
// Session file upload (user Sell Season or admin season upload). The file is
// downloaded and extracted synchronously, then queued in BotState — processing
// runs in processSellSeasonJobs so the webhook never times out.
export async function handleDocument(base44, token, msg, tgUser) {
  const chatId = msg.chat.id;
  const replyTo = msg.message_id;
  const adminSeasonDocRec = await getState(base44, `adminseason:${String(tgUser.id)}`);
  const sellSeasonDocRec = adminSeasonDocRec || await getState(base44, `sellseason:${String(tgUser.id)}`);
  const isAdminUpload = !!adminSeasonDocRec;
  if (!sellSeasonDocRec) return;
  const docUser = await findUserByTelegramId(base44, String(tgUser.id));
  if (!docUser) {
    await tgSend(token, chatId, t('en', 'bind.required'), replyTo);
    return;
  }
  if (isAdminUpload && docUser.role !== 'admin') {
    await clearState(base44, `adminseason:${String(tgUser.id)}`);
    await tgSend(token, chatId, '⚠️ Admin only.', replyTo);
    return;
  }
  const docLang = (await getUserContext(base44, String(tgUser.id))).lang;
  const fileName = msg.document.file_name || 'sessions.txt';
  const receivedMsg = await tgSend(token, chatId, `📥 <b>File received:</b> ${fileName}\n\n🔄 Processing... please wait`, replyTo);
  const receivedMsgId = receivedMsg?.result?.message_id;
  try {
    const fileBytes = await tgDownloadFileBytes(token, msg.document.file_id);
    const { sessions } = await extractSessionsFromFile(fileBytes, fileName);
    if (!sessions.length) {
      await tgSend(token, chatId, t(docLang, 'sell.seasonNoSessions'), replyTo);
      return;
    }
    await clearState(base44, `sellseason:${String(tgUser.id)}`);
    await clearState(base44, `adminseason:${String(tgUser.id)}`);
    const foundMsg = await tgSend(token, chatId, `📊 Found <b>${sessions.length}</b> session(s). Processing now...`, replyTo);
    // Sessions are stored in parts of 200 — one huge array in a single state
    // field cannot be saved reliably.
    const jobRef = `${Date.now()}:${chatId}`;
    const partCount = Math.ceil(sessions.length / 200);
    for(let p = 0; p < partCount; p++){
      await setState(base44, `sellseason_part:${jobRef}:${p}`, JSON.stringify(sessions.slice(p * 200, (p + 1) * 200)));
    }
    await setState(base44, `sellseason_job:${jobRef}`, JSON.stringify({
      cleanup_msgs: [
        receivedMsgId,
        foundMsg?.result?.message_id
      ].filter(Boolean),
      job_ref: jobRef,
      part_count: partCount,
      total: sessions.length,
      chat_id: chatId,
      user_email: docUser.email,
      lang: docLang,
      reply_to: replyTo,
      admin_upload: isAdminUpload,
      status: 'pending',
      created: Date.now()
    }));
    // Started over HTTP so the heavy session work runs in its own request with
    // its own CPU budget — in-process it killed the webhook isolate.
    waitUntil(selfTrigger('processSellSeasonJobs', {}));
  } catch (err) {
    await tgSend(token, chatId, `❌ Error: ${err.message}`, replyTo);
  }
}
// Country search query typed after tapping the search button.
export async function handleBuySearch(base44, token, ctx) {
  const { chatId, replyTo, rawText, lang, tgUser } = ctx;
  await clearState(base44, `buysearch:${String(tgUser.id)}`);
  await setState(base44, `buypage_query:${String(tgUser.id)}`, rawText);
  const countries = await base44.asServiceRole.entities.Country.filter({
    active: true,
    platform: 'tg'
  });
  if (!countries.length) {
    await tgSend(token, chatId, '❌ No countries available.', replyTo);
    return true;
  }
  const q = rawText.toLowerCase().trim();
  const qNorm = q.replace(/^\+/, '');
  const matches = countries.filter((c)=>(c.iso || '').toLowerCase() === q || (c.iso || '').toLowerCase().includes(q) || (c.dial_code || '').toLowerCase() === q || (c.dial_code || '').toLowerCase() === qNorm || (c.name || '').toLowerCase().includes(q));
  await tgSendMenu(token, chatId, matches.length ? t(lang, 'buy.searchResult', {
    query: rawText
  }) : t(lang, 'buy.searchNoResult', {
    query: rawText
  }), buildCountryKeyboard(countries, lang, rawText, 1), replyTo);
  return true;
}
// Numeric replies: top-up amount, withdrawal amount, custom season quantity.
export async function handleNumericFlows(base44, token, ctx) {
  const { chatId, replyTo, rawText, lang, tgUser, user } = ctx;
  const tid = String(tgUser.id);
  const topupStateRec = await getState(base44, `topup:${tid}`);
  if (topupStateRec) {
    const topupState = JSON.parse(topupStateRec.value);
    if (topupState.status === 'awaiting_amount') {
      const amount = parseFloat(rawText);
      if (!amount || amount < 1) {
        await tgSend(token, chatId, `❌ Minimum top-up amount is $1. Please enter an amount of $1 or more:`, replyTo);
        return true;
      }
      const tpView = topupMethodView(amount);
      await tgSendMenu(token, chatId, tpView.text, tpView.keyboard, replyTo);
      await clearState(base44, `topup:${tid}`);
      return true;
    }
  }
  const withdrawAmtRec = await getState(base44, `withdraw:${tid}`);
  if (withdrawAmtRec) {
    const withdrawState = JSON.parse(withdrawAmtRec.value);
    if (withdrawState.status === 'awaiting_amount') {
      const amount = parseFloat(rawText);
      const MIN_WITHDRAW = 3;
      if (!amount || amount < MIN_WITHDRAW) {
        const minMsg = await tgSend(token, chatId, `❗ <b>Minimum withdrawal is $${MIN_WITHDRAW}</b>\n\nPlease enter an amount of $${MIN_WITHDRAW} or more:`, replyTo);
        await setState(base44, `withdraw:${tid}`, JSON.stringify({
          status: 'awaiting_amount',
          msgs: [
            ...withdrawState.msgs || [],
            replyTo,
            minMsg?.result?.message_id
          ].filter(Boolean)
        }));
        return true;
      }
      const addrMsg = await tgSend(token, chatId, t(lang, 'withdraw.addrPrompt', {
        amount
      }), replyTo);
      await setState(base44, `withdraw:${tid}`, JSON.stringify({
        amount,
        status: 'awaiting_address',
        msgs: [
          ...withdrawState.msgs || [],
          replyTo,
          addrMsg?.result?.message_id
        ].filter(Boolean)
      }));
      return true;
    }
  }
  const seasonQtyRec = await getState(base44, `season:${tid}`);
  if (seasonQtyRec) {
    const seasonState = JSON.parse(seasonQtyRec.value);
    if (seasonState.status === 'awaiting_qty') {
      const qty = parseInt(rawText);
      if (!qty || qty < 2) {
        await tgSend(token, chatId, t(lang, 'buy.invalidQty'), replyTo);
        return true;
      }
      const iso = seasonState.iso;
      const country = (await base44.asServiceRole.entities.Country.filter({
        iso,
        active: true,
        platform: 'tg'
      }))[0];
      await clearState(base44, `season:${tid}`);
      if (!country) {
        await tgSend(token, chatId, `❌ Country ${iso} not found.`, replyTo);
        return true;
      }
      const bal = await getRealBalance(base44, user.email);
      const total = Number((country.price * qty).toFixed(2));
      if ((country.stock || 0) < qty) {
        await tgSend(token, chatId, t(lang, 'buy.seasonInsufficientStock', {
          available: country.stock || 0,
          qty
        }), replyTo);
        return true;
      }
      if (bal < total) {
        await tgSendMenu(token, chatId, `${t(lang, 'buy.seasonInsufficientBalance')}\n\n${t(lang, 'buy.seasonInsufficientBalanceDesc', {
          balance: bal.toFixed(2),
          total: total.toFixed(2)
        })}`, [
          [
            {
              text: t(lang, 'buy.back'),
              callback_data: `buyseason:${iso}`
            }
          ]
        ], replyTo);
        return true;
      }
      await tgSendMenu(token, chatId, `${t(lang, 'buy.seasonConfirmTitle')}\n\n${t(lang, 'buy.seasonConfirmQty', {
        qty
      })}\n${t(lang, 'buy.seasonConfirmCost', {
        total: total.toFixed(2)
      })}\n${t(lang, 'buy.seasonConfirmBalance', {
        balance: bal.toFixed(2)
      })}`, [
        [
          {
            text: t(lang, 'buy.seasonConfirmBtn'),
            callback_data: `seasonconfirm:${iso}:${qty}`
          }
        ],
        [
          {
            text: t(lang, 'buy.back'),
            callback_data: `buyseason:${iso}`
          }
        ]
      ], replyTo);
      return true;
    }
  }
  const mkQtyRec = await getState(base44, `mkqty:${tid}`);
  if (mkQtyRec) {
    const mkState = JSON.parse(mkQtyRec.value);
    await clearState(base44, `mkqty:${tid}`);
    if (user && mkState.status === 'awaiting_qty') {
      await showMarketConfirm(base44, token, user, chatId, mkState.seller_email, mkState.iso, parseInt(rawText), {
        replyTo
      });
      return true;
    }
  }
  return false;
}
// Shared success/rejection reporting for the guided sell flow.
async function reportSellResult(base44, token, ctx, data, sellMsgs) {
  const { chatId, replyTo, tgUser } = ctx;
  if (data.status === 'completed' || data.success) {
    for (const mid of sellMsgs)await tgDeleteMessage(token, chatId, mid);
    let msg = `✅ <b>Account Received Successfully</b>\n\n`;
    msg += `🛡️ Spam check: <b>Passed</b>\n`;
    msg += `🔐 2FA password: <b>Set</b>\n`;
    if (data.country) msg += `🌍 Country: ${data.country_flag || ''} ${data.country_name || data.country}\n`;
    if (data.phone) msg += `📱 Phone: <code>${data.phone}</code>\n`;
    msg += `\nThe account has been added to your stock — it is now live in the Market.`;
    await tgSend(token, chatId, msg, replyTo);
    const logoutMsg = await tgSend(token, chatId, `⚠️ <b>Please logout from your devices</b> for security.`, replyTo);
    // Sell mode stays active so the next number needs no extra tap.
    await setState(base44, `sell:${String(tgUser.id)}`, JSON.stringify({
      status: 'awaiting_phone'
    }));
    const nextNumMsg = await tgSend(token, chatId, `🔁 Send the next phone number to sell, or tap another button to exit sell mode.`, replyTo);
    await new Promise((r)=>setTimeout(r, 1000));
    try {
      if (logoutMsg?.result?.message_id) await tgDeleteMessage(token, chatId, logoutMsg.result.message_id);
      if (nextNumMsg?.result?.message_id) await tgDeleteMessage(token, chatId, nextNumMsg.result.message_id);
    } catch  {}
    return;
  }
  if (data.status === 'rejected') {
    await tgSend(token, chatId, `❌ <b>Rejected:</b> ${REJECT_REASONS[data.reason] || data.reason || 'Unknown reason'}`, replyTo);
    await setState(base44, `sell:${String(tgUser.id)}`, JSON.stringify({
      status: 'awaiting_phone'
    }));
    const rejNextMsg = await tgSend(token, chatId, `🔁 Send the next phone number to sell, or tap another button to exit sell mode.`, replyTo);
    await new Promise((r)=>setTimeout(r, 1000));
    try {
      if (rejNextMsg?.result?.message_id) await tgDeleteMessage(token, chatId, rejNextMsg.result.message_id);
    } catch  {}
    return;
  }
  await clearState(base44, `sell:${String(tgUser.id)}`);
  await tgSend(token, chatId, `✅ Done. ${JSON.stringify(data).slice(0, 200)}`, replyTo);
}
// Guided sell flow: phone → OTP → optional 2FA.
export async function handleSellFlow(base44, token, ctx, sellState) {
  const { chatId, replyTo, rawText, lang, tgUser, user } = ctx;
  const tid = String(tgUser.id);
  if (sellState.status === 'awaiting_phone') {
    const phone = rawText.replace(/\s+/g, '');
    if (!/^\+?\d{6,}$/.test(phone)) {
      await tgSend(token, chatId, t(lang, 'invalid.phone'), replyTo);
      return true;
    }
    if (!user) {
      await clearState(base44, `sell:${tid}`);
      await tgSend(token, chatId, t(lang, 'bind.required'), replyTo);
      return true;
    }
    const connectingMsg = await tgSend(token, chatId, `🧬connecting ${phone}`, replyTo);
    try {
      const result = await base44.asServiceRole.functions.invoke('sendLoginCode', {
        phone_number: phone,
        user_email: user.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      await setState(base44, `sell:${tid}`, JSON.stringify({
        status: 'awaiting_code',
        request_id: data.request_id,
        phone,
        msgs: [
          connectingMsg?.result?.message_id
        ].filter(Boolean)
      }));
      await tgSend(token, chatId, `Code Send ${phone} send otp`, replyTo);
    } catch (err) {
      const errMsg = String(err?.message || '');
      if (/409|already exists|NUMBER_EXISTS/i.test(errMsg)) {
        await clearState(base44, `sell:${tid}`);
        await tgSend(token, chatId, t(lang, 'sell.numberExists'), replyTo);
      } else if (/Capacity is full|COUNTRY_CAPACITY_FULL/i.test(errMsg)) {
        // Country disabled by admin — stay in sell mode for the next number.
        await setState(base44, `sell:${tid}`, JSON.stringify({
          status: 'awaiting_phone'
        }));
        await tgSend(token, chatId, `📦 <b>This Country Capacity is full.</b>\nTry Again After Some Time`, replyTo);
      } else {
        await clearState(base44, `sell:${tid}`);
        await tgSend(token, chatId, `❌ Error: ${err.message}`, replyTo);
      }
    }
    return true;
  }
  if (sellState.status === 'awaiting_code') {
    const code = rawText.replace(/\s+/g, '');
    if (!/^\d{4,6}$/.test(code)) {
      await tgSend(token, chatId, '❌ Invalid code. Please enter the 4-6 digit OTP code:', replyTo);
      return true;
    }
    const verifyMsg = await tgSend(token, chatId, `🔄 Verifying code...`, replyTo);
    const sellMsgs = [
      ...sellState.msgs || [],
      verifyMsg?.result?.message_id
    ].filter(Boolean);
    try {
      const result = await base44.asServiceRole.functions.invoke('verifyLoginCode', {
        request_id: sellState.request_id,
        phone_code: code,
        user_email: user.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      await reportSellResult(base44, token, ctx, data, sellMsgs);
    } catch (err) {
      const m = (err.message || '').toLowerCase();
      if (m.includes('has 2fa')) {
        await clearState(base44, `sell:${tid}`);
        await tgSend(token, chatId, `❌ <b>This account has 2FA enabled</b>\n\nRemove 2FA from the account first, then sell it. Send another phone number to continue selling.`, replyTo);
      } else if (m.includes('code') || m.includes('invalid') || m.includes('expired')) {
        await tgSend(token, chatId, `❌ <b>Wrong Code</b>\n\nPlease enter the correct OTP code:`, replyTo);
      } else {
        await clearState(base44, `sell:${tid}`);
        await tgSend(token, chatId, `❌ Error: ${err.message}`, replyTo);
      }
    }
    return true;
  }
  return false;
}
// Pasted session strings (Sell Season), TXID, withdrawal address and admin
// session-string uploads.
export async function handleTextFlows(base44, token, ctx) {
  const { chatId, replyTo, rawText, lang, tgUser, user } = ctx;
  const tid = String(tgUser.id);
  const sellSeasonRec = await getState(base44, `sellseason:${tid}`);
  if (sellSeasonRec) {
    const sessions = rawText.split(/\n+/).map((s)=>s.trim()).filter(Boolean);
    if (!sessions.length) {
      await tgSend(token, chatId, t(lang, 'sell.seasonNoSessions'), replyTo);
      return true;
    }
    await clearState(base44, `sellseason:${tid}`);
    // Processed in the background so the webhook reply is never delayed.
    waitUntil((async ()=>{
      try {
        await processSellSeasonBulk(base44, token, chatId, sessions, user.email, lang, replyTo);
      } catch (err) {
        await tgSend(token, chatId, `❌ Error: ${err.message}`, replyTo);
      }
    })());
    return true;
  }
  const txidStateRec = await getState(base44, `topup:${tid}`);
  if (txidStateRec) {
    const txidState = JSON.parse(txidStateRec.value);
    if (txidState.status === 'awaiting_txid') {
      const txid = rawText.trim();
      if (txid.length < 8) {
        await tgSend(token, chatId, '❌ Invalid TXID. Please send a valid transaction hash:', replyTo);
        return true;
      }
      try {
        const result = await base44.asServiceRole.functions.invoke('submitManualTopUp', {
          amount: txidState.amount,
          coin: 'USDT',
          tx_hash: txid,
          user_email: user.email
        });
        const data = result.data || result;
        if (data.error) throw new Error(data.error);
        await clearState(base44, `topup:${tid}`);
        // Wipe the whole conversation — submitManualTopUp sends the one receipt.
        await Promise.all([
          ...txidState.msgs || [],
          replyTo
        ].filter(Boolean).map((mid)=>tgDeleteMessage(token, chatId, mid).catch(()=>{})));
      } catch (err) {
        await tgSend(token, chatId, `❌ Error: ${err.message}`, replyTo);
      }
      return true;
    }
  }
  const withdrawAddrRec = await getState(base44, `withdraw:${tid}`);
  if (withdrawAddrRec) {
    const withdrawState = JSON.parse(withdrawAddrRec.value);
    if (withdrawState.status === 'awaiting_address') {
      const wallet = rawText.trim();
      if (wallet.length < 10) {
        await tgSend(token, chatId, '❌ Invalid address. Please send a valid wallet address:', replyTo);
        return true;
      }
      try {
        const result = await base44.asServiceRole.functions.invoke('requestWithdrawal', {
          amount: withdrawState.amount,
          wallet_address: wallet,
          user_email: user.email
        });
        const data = result.data || result;
        if (data.error) throw new Error(data.error);
        await clearState(base44, `withdraw:${tid}`);
        await Promise.all([
          ...withdrawState.msgs || [],
          replyTo
        ].filter(Boolean).map((mid)=>tgDeleteMessage(token, chatId, mid).catch(()=>{})));
      } catch (err) {
        await tgSend(token, chatId, `❌ Error: ${err.message}`, replyTo);
      }
      return true;
    }
  }
  if (user.role === 'admin') {
    const uploadRec = await getState(base44, `upload:${tid}`);
    if (uploadRec) {
      const uploadState = JSON.parse(uploadRec.value);
      if (uploadState.status === 'awaiting_sessions') {
        const sessions = rawText.split(/\n+/).map((s)=>s.trim()).filter(Boolean);
        if (!sessions.length) {
          await tgSend(token, chatId, '❌ No session strings found. Please send session strings (one per line):', replyTo);
          return true;
        }
        await clearState(base44, `upload:${tid}`);
        await tgSend(token, chatId, `🔄 Uploading ${sessions.length} session(s) to ${uploadState.iso}...`, replyTo);
        try {
          const result = await base44.asServiceRole.functions.invoke('uploadSessions', {
            country_iso: uploadState.iso,
            sessions
          });
          const data = result.data || result;
          if (data.error) throw new Error(data.error);
          let msg = `✅ <b>Upload Complete</b>\n\nCountry: ${data.country_name || uploadState.iso}\nAdded: ${data.added}/${data.total}\nFailed: ${data.failed}`;
          if (data.failed > 0 && Array.isArray(data.failed_details)) {
            const tally = {};
            for (const f of data.failed_details)tally[f.reason] = (tally[f.reason] || 0) + 1;
            const lines = Object.entries(tally).map(([reason, count])=>`• ${reason}: ${count}`).join('\n');
            if (lines) msg += `\n\n<b>Failed breakdown:</b>\n${lines}`;
          }
          await tgSend(token, chatId, msg, replyTo);
          if (data.failed_file_url) {
            await tgSendDoc(token, chatId, data.failed_file_url, `❌ Failed sessions log (${data.failed}) — not added to stock`);
          }
        } catch (err) {
          await tgSend(token, chatId, `❌ Error: ${err.message}`, replyTo);
        }
        return true;
      }
    }
  }
  return false;
}