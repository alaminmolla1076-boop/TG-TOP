import { t } from '../_shared/botTranslations.js';
import { tgSend, tgSendMenu, tgDeleteMessage, tgSendDoc, tgDownloadFileBytes } from '../_shared/telegramApi.ts';
import { getRealBalance } from '../_shared/balance.ts';
import { extractSessionsFromFile } from '../_shared/extractSessions.js';
import { waitUntil } from '../_shared/b44.ts';
import { selfInvoke, selfTrigger } from '../_shared/selfInvoke.ts';
import { getState, setState, clearState, getUserContext, findUserByTelegramId } from './state.ts';
import { buildCountryKeyboard } from './keyboards.ts';
import { showMarketConfirm } from './market.ts';
import { topupMethodView } from './topup.ts';
import { WD_MIN, WD_FEE, withdrawNetworkView, checkWithdrawBalance } from './withdraw.ts';
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
  const receivedMsg = await tgSend(token, chatId, `${t(docLang, 'sf.fileReceived', { name: fileName })}\n\n${t(docLang, 'sf.processingWait')}`, replyTo);
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
    const foundMsg = await tgSend(token, chatId, t(docLang, 'sf.found', { count: sessions.length }), replyTo);
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
    await tgSend(token, chatId, t(docLang, 'c.error', { msg: err.message }), replyTo);
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
    await tgSend(token, chatId, t(lang, 'sf.noCountries'), replyTo);
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
        await tgSend(token, chatId, t(lang, 'tu.minTopup'), replyTo);
        return true;
      }
      const tpView = topupMethodView(amount, lang);
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
      if (!amount || amount < WD_MIN) {
        const minMsg = await tgSend(token, chatId, t(lang, 'wd.minWithdraw', { min: WD_MIN }), replyTo);
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
      // The fee must stay in the account on top of the requested amount.
      const balCheck = await checkWithdrawBalance(base44, user, amount, lang);
      if (balCheck.error) {
        const errMsg = await tgSend(token, chatId, balCheck.error, replyTo);
        await setState(base44, `withdraw:${tid}`, JSON.stringify({
          status: 'awaiting_amount',
          msgs: [
            ...withdrawState.msgs || [],
            replyTo,
            errMsg?.result?.message_id
          ].filter(Boolean)
        }));
        return true;
      }
      const v = withdrawNetworkView(amount, balCheck.balance, lang);
      await tgSendMenu(token, chatId, v.text, v.keyboard, replyTo);
      await clearState(base44, `withdraw:${tid}`);
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
        await tgSend(token, chatId, t(lang, 'mk.countryNotFound'), replyTo);
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
        replyTo,
        lang,
        pool: mkState.pool
      });
      return true;
    }
  }
  return false;
}
// Shared success/rejection reporting for the guided sell flow.
async function reportSellResult(base44, token, ctx, data, sellMsgs) {
  const { chatId, replyTo, tgUser, lang } = ctx;
  const L = lang || 'en';
  if (data.status === 'completed' || data.success) {
    for (const mid of sellMsgs)await tgDeleteMessage(token, chatId, mid);
    let msg = `${t(L, 'sf.received')}\n\n`;
    msg += `${t(L, data.spam ? 'sf.spamFlagged' : 'sf.spamPassed')}\n`;
    msg += `${t(L, 'sf.twofaSet')}\n`;
    if (data.country) msg += `${t(L, 'sf.country', { flag: data.country_flag || '', country: data.country_name || data.country })}\n`;
    if (data.phone) msg += `${t(L, 'mk.phone', { phone: data.phone })}\n`;
    msg += `\n${t(L, data.spam ? 'sf.spamAdded' : 'sf.nonSpamAdded')}`;
    msg += `\n\n${t(L, 'sf.safe')}`;
    await tgSend(token, chatId, msg, replyTo);
    const logoutMsg = await tgSend(token, chatId, t(L, 'sf.logout'), replyTo);
    // Sell mode stays active so the next number needs no extra tap.
    await setState(base44, `sell:${String(tgUser.id)}`, JSON.stringify({
      status: 'awaiting_phone'
    }));
    const nextNumMsg = await tgSend(token, chatId, t(L, 'sf.nextNumber'), replyTo);
    await new Promise((r)=>setTimeout(r, 1000));
    try {
      if (logoutMsg?.result?.message_id) await tgDeleteMessage(token, chatId, logoutMsg.result.message_id);
      if (nextNumMsg?.result?.message_id) await tgDeleteMessage(token, chatId, nextNumMsg.result.message_id);
    } catch  {}
    return;
  }
  if (data.status === 'rejected') {
    await tgSend(token, chatId, t(L, 'sf.rejected', { reason: REJECT_REASONS[data.reason] || data.reason || t(L, 'sf.unknownReason') }), replyTo);
    await setState(base44, `sell:${String(tgUser.id)}`, JSON.stringify({
      status: 'awaiting_phone'
    }));
    const rejNextMsg = await tgSend(token, chatId, t(L, 'sf.nextNumber'), replyTo);
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
  // 2FA password reply — the code was already accepted, finish the login.
  if (sellState.status === 'awaiting_2fa') {
    const password = rawText.trim();
    const verifyMsg = await tgSend(token, chatId, t(lang, 'sf.checking2fa'), replyTo);
    const sellMsgs = [
      ...sellState.msgs || [],
      verifyMsg?.result?.message_id
    ].filter(Boolean);
    try {
      const result = await selfInvoke('verifyLoginCode', {
        request_id: sellState.request_id,
        password,
        user_email: user.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      await reportSellResult(base44, token, ctx, data, sellMsgs);
    } catch (err) {
      const m = (err.message || '').toLowerCase();
      if (/password|2fa|flood|fresh/.test(m)) {
        await tgSend(token, chatId, t(lang, 'sf.wrong2fa'), replyTo);
      } else {
        await clearState(base44, `sell:${tid}`);
        await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
      }
    }
    return true;
  }
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
    const connectingMsg = await tgSend(token, chatId, t(lang, 'sf.connecting', { phone }), replyTo);
    try {
      const result = await selfInvoke('sendLoginCode', {
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
      await tgSend(token, chatId, t(lang, 'sf.codeSent', { phone }), replyTo);
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
        await tgSend(token, chatId, t(lang, 'sf.capacityFull'), replyTo);
      } else {
        await clearState(base44, `sell:${tid}`);
        await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
      }
    }
    return true;
  }
  if (sellState.status === 'awaiting_code') {
    const code = rawText.replace(/\s+/g, '');
    if (!/^\d{4,6}$/.test(code)) {
      await tgSend(token, chatId, t(lang, 'sf.invalidOtp'), replyTo);
      return true;
    }
    const verifyMsg = await tgSend(token, chatId, t(lang, 'sf.verifying'), replyTo);
    const sellMsgs = [
      ...sellState.msgs || [],
      verifyMsg?.result?.message_id
    ].filter(Boolean);
    try {
      const result = await selfInvoke('verifyLoginCode', {
        request_id: sellState.request_id,
        phone_code: code,
        user_email: user.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      await reportSellResult(base44, token, ctx, data, sellMsgs);
    } catch (err) {
      const m = (err.message || '').toLowerCase();
      if (/2fa_required/i.test(m)) {
        await setState(base44, `sell:${tid}`, JSON.stringify({
          status: 'awaiting_2fa',
          request_id: sellState.request_id,
          phone: sellState.phone,
          msgs: sellMsgs
        }));
        await tgSend(token, chatId, t(lang, 'sf.has2fa'), replyTo);
      } else if (m.includes('code') || m.includes('invalid') || m.includes('expired')) {
        await tgSend(token, chatId, t(lang, 'sf.wrongCode'), replyTo);
      } else {
        await clearState(base44, `sell:${tid}`);
        await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
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
        await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
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
        await tgSend(token, chatId, t(lang, 'sf.invalidTxid'), replyTo);
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
        await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
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
        await tgSend(token, chatId, t(lang, 'sf.invalidAddress'), replyTo);
        return true;
      }
      try {
        const result = await base44.asServiceRole.functions.invoke('requestWithdrawal', {
          amount: withdrawState.amount,
          network: withdrawState.network || 'BEP20',
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
        await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
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
          await tgSend(token, chatId, t(lang, 'sf.noSessions'), replyTo);
          return true;
        }
        await clearState(base44, `upload:${tid}`);
        await tgSend(token, chatId, t(lang, 'sf.uploading', { count: sessions.length, iso: uploadState.iso }), replyTo);
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
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        return true;
      }
    }
  }
  return false;
}

// ── Sell Multiple ──────────────────────────────────────────────────────────
// Sequential bulk selling: the seller sends a list of phone numbers, the bot
// logs in one at a time (OTP per number, the account's 2FA password when
// needed), sets a system 2FA on each and adds it to the seller's stock.
const extractPhoneNumbers = (text) => {
  const out = [];
  const seen = new Set();
  for (const m of String(text).matchAll(/\+?\d{7,15}/g)) {
    const p = m[0].replace(/^\+/, '+');
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
};

// Starts the next number in the queue, or reports completion.
async function sellMultiNext(base44, token, ctx, st) {
  const { chatId, replyTo, user, lang } = ctx;
  const L = lang || 'en';
  const tid = String(ctx.tgUser.id);
  while (st.idx < st.numbers.length) {
    const phone = st.numbers[st.idx];
    try {
      const result = await selfInvoke('sendLoginCode', {
        phone_number: phone,
        user_email: user.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      st.request_id = data.request_id;
      st.phone = phone;
      st.sub = 'otp';
      await setState(base44, `sellmulti:${tid}`, JSON.stringify(st));
      await tgSend(token, chatId, t(L, 'sf.connecting', { phone }), replyTo);
      await tgSend(token, chatId, t(L, 'sf.codeSent', { phone }), replyTo);
      return;
    } catch (err) {
      const m = String(err.message || '');
      const reason = /409|already exists|NUMBER_EXISTS/i.test(m) ? t(L, 'sf.alreadyIn') : m;
      await tgSend(token, chatId, t(L, 'sf.phoneIssue', { phone, reason }), replyTo);
      st.idx++;
    }
  }
  await clearState(base44, `sellmulti:${tid}`);
  await tgSend(token, chatId, t(L, 'sf.sellMultiDone', { done: st.done || 0, total: st.numbers.length }), replyTo);
}

export async function handleSellMultiFlow(base44, token, ctx, st) {
  const { chatId, replyTo, rawText, tgUser, user, lang } = ctx;
  const tid = String(tgUser.id);
  // Step 1 — the list of phone numbers.
  if (st.status === 'awaiting_numbers') {
    const numbers = extractPhoneNumbers(rawText);
    if (!numbers.length) {
      await tgSend(token, chatId, t(lang, 'sf.noPhones'), replyTo);
      return true;
    }
    await tgSend(token, chatId, t(lang, 'sf.phonesReceived', { count: numbers.length }), replyTo);
    st = {
      status: 'processing',
      numbers,
      idx: 0,
      done: 0
    };
    await sellMultiNext(base44, token, ctx, st);
    return true;
  }
  if (st.status !== 'processing') return false;
  if (!user) {
    await clearState(base44, `sellmulti:${tid}`);
    return false;
  }
  // OTP reply for the current number.
  if (st.sub === 'otp') {
    const code = rawText.replace(/\s+/g, '');
    if (!/^\d{4,6}$/.test(code)) {
      await tgSend(token, chatId, t(lang, 'sf.invalidOtpFor', { phone: st.phone }), replyTo);
      return true;
    }
    const verifyMsg = await tgSend(token, chatId, t(lang, 'sf.verifying'), replyTo);
    try {
      const result = await selfInvoke('verifyLoginCode', {
        request_id: st.request_id,
        phone_code: code,
        user_email: user.email
      });
      const data = result.data || result;
      if (data.error === '2FA_REQUIRED') throw new Error('2FA_REQUIRED');
      if (data.error) throw new Error(data.error);
      try {
        if (verifyMsg?.result?.message_id) await tgDeleteMessage(token, chatId, verifyMsg.result.message_id);
      } catch  {}
      await tgSend(token, chatId, t(lang, 'sf.loggedIn', { phone: data.phone || st.phone }), replyTo);
      st.done++;
      st.idx++;
      await sellMultiNext(base44, token, ctx, st);
    } catch (err) {
      try {
        if (verifyMsg?.result?.message_id) await tgDeleteMessage(token, chatId, verifyMsg.result.message_id);
      } catch  {}
      const m = String(err.message || '');
      if (m === '2FA_REQUIRED') {
        st.sub = '2fa';
        await setState(base44, `sellmulti:${tid}`, JSON.stringify(st));
        await tgSend(token, chatId, t(lang, 'sf.phone2fa', { phone: st.phone }), replyTo);
        return true;
      }
      if (/code|invalid|expired/i.test(m)) {
        await tgSend(token, chatId, t(lang, 'sf.wrongOtpFor', { phone: st.phone }), replyTo);
        return true;
      }
      await tgSend(token, chatId, t(lang, 'sf.phoneError', { phone: st.phone, error: m }), replyTo);
      st.idx++;
      await sellMultiNext(base44, token, ctx, st);
    }
    return true;
  }
  // 2FA password reply for the current number.
  if (st.sub === '2fa') {
    const password = rawText.trim();
    const verifyMsg = await tgSend(token, chatId, t(lang, 'sf.checking2fa'), replyTo);
    try {
      const result = await selfInvoke('verifyLoginCode', {
        request_id: st.request_id,
        password,
        user_email: user.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      try {
        if (verifyMsg?.result?.message_id) await tgDeleteMessage(token, chatId, verifyMsg.result.message_id);
      } catch  {}
      await tgSend(token, chatId, t(lang, 'sf.twofaChanged', { phone: data.phone || st.phone }), replyTo);
      st.done++;
      st.idx++;
      await sellMultiNext(base44, token, ctx, st);
    } catch (err) {
      try {
        if (verifyMsg?.result?.message_id) await tgDeleteMessage(token, chatId, verifyMsg.result.message_id);
      } catch  {}
      const m = String(err.message || '');
      if (/password|2fa|flood|fresh/i.test(m)) {
        await tgSend(token, chatId, t(lang, 'sf.wrong2faFor', { phone: st.phone }), replyTo);
        return true;
      }
      await tgSend(token, chatId, t(lang, 'sf.phoneError', { phone: st.phone, error: m }), replyTo);
      st.idx++;
      await sellMultiNext(base44, token, ctx, st);
    }
    return true;
  }
  return false;
}