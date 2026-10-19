import { t, BOT_LANGS } from '../_shared/botTranslations.js';
import { tgSend, tgSendMenu, tgSendReplyKeyboard } from '../_shared/telegramApi.ts';
import { getRealBalance } from '../_shared/balance.ts';
import { buildRewardsPage, buildUserRewards } from '../_shared/rewardViews.js';
import { buySeasonInChunks } from '../_shared/seasonBuy.js';
import { getState, setState, clearState, findUserByTelegramId, findUserByBindCode } from './state.ts';
import { mainReplyKeyboard } from './keyboards.ts';
import { marketMenu } from './market.ts';
import { topupAmountView } from './topup.ts';
import { withdrawAmountView } from './withdraw.ts';
import { formatCountries, formatOrders, formatStatus } from './views.ts';
import { deliverSeasonZip, handleBind, handleSeasonGen, errText } from './delivery.ts';
// The bot's slash-command / reply-keyboard command switch.
export default async function handleCommand(base44, token, ctx) {
  const { cmd, text, chatId, replyTo, lang, settings, tgUser, user } = ctx;
  const requireUser = async ()=>{
    if (!user) {
      await tgSend(token, chatId, t(lang, 'bind.required'), replyTo);
      return false;
    }
    return true;
  };
  const requireAdmin = async ()=>{
    if (!user || user.role !== 'admin') {
      await tgSend(token, chatId, '⚠️ Admin only.', replyTo);
      return false;
    }
    return true;
  };
  const parts = text.trim().split(/\s+/);
  switch(cmd){
    case 'start':
      {
        // The main menu rides as the bot reply keyboard — Telegram shows the
        // "four-dot" toggle in the input field for it.
        await tgSendReplyKeyboard(token, chatId, t(lang, 'welcome.title') + '\n\n' + (user ? `👤 Username: ${user.telegram_username ? '@' + user.telegram_username : 'N/A'}\n🆔 ID: <code>${user.telegram_id || tgUser.id}</code>\n` : t(lang, 'welcome.notLinked') + '\n') + '\n' + t(lang, 'welcome.start'), mainReplyKeyboard(lang, {
          hidePremium: settings.premium_hidden,
          hideStars: settings.stars_hidden
        }), replyTo);
        break;
      }
    case 'menu':
      {
        await tgSendReplyKeyboard(token, chatId, t(lang, 'menu.title') + '\n\n' + t(lang, 'menu.prompt'), mainReplyKeyboard(lang, {
          hidePremium: settings.premium_hidden,
          hideStars: settings.stars_hidden
        }), replyTo);
        break;
      }
    case 'help':
      await tgSend(token, chatId, `${t(lang, 'help.title')}\n\n${t(lang, 'help.body')}`, replyTo);
      break;
    case 'myaccount':
      {
        if (!await requireUser()) break;
        const [accounts, sessions, topups, withdrawals] = await Promise.all([
          base44.asServiceRole.entities.TgAccount.filter({
            owner_email: user.email
          }),
          base44.asServiceRole.entities.SessionRequest.filter({
            user_email: user.email,
            status: 'completed'
          }),
          base44.asServiceRole.entities.TopUp.filter({
            user_email: user.email,
            status: 'approved'
          }),
          base44.asServiceRole.entities.Withdrawal.filter({
            user_email: user.email
          })
        ]);
        const bal = await getRealBalance(base44, user.email);
        const totalDeposits = topups.reduce((sum, tp)=>sum + (tp.amount || 0), 0);
        const totalWithdrawals = withdrawals.filter((w)=>w.status === 'approved').reduce((sum, w)=>sum + (w.amount || 0), 0);
        const name = [
          user.telegram_first_name,
          user.telegram_last_name
        ].filter(Boolean).join(' ') || user.full_name || user.email;
        const sep = '━━━━━━━━━━━━━━━━━━';
        await tgSend(token, chatId, `${sep}\n${t(lang, 'myaccount.title')}\n${sep}\n\n` + `<b>${name}</b>\n` + `🔗 ${user.telegram_username ? `@${user.telegram_username}` : 'N/A'}\n` + `🆔 <code>${user.telegram_id || user.id}</code>\n\n` + `┈┈┈┈ 📊 <b>Statistics</b> ┈┈┈┈\n` + `🛒 Purchased: <b>${accounts.length} account(s)</b>\n` + `📱 Sold: <b>${sessions.length} account(s)</b>\n` + `🔐 Total Login: <b>${sessions.length}</b>\n` + `💰 Total Top Up: <b>$${totalDeposits.toFixed(2)}</b>\n` + `💸 Total Withdraw: <b>$${totalWithdrawals.toFixed(2)}</b>\n\n` + `${sep}\n💎 <b>Balance: $${bal.toFixed(2)}</b>\n${sep}` + await buildUserRewards(base44, user.email), replyTo);
        break;
      }
    case 'balance':
      {
        if (!await requireUser()) break;
        const bal = await getRealBalance(base44, user.email);
        await tgSend(token, chatId, `${t(lang, 'balance.title')}\n\n$${bal.toFixed(2)}`, replyTo);
        break;
      }
    case 'countries':
      await tgSend(token, chatId, await formatCountries(base44, lang), replyTo);
      break;
    case 'rewards':
      {
        if (!await requireUser()) break;
        const { text: rewText, keyboard: rewKb } = await buildRewardsPage(base44, lang, 1);
        await tgSendMenu(token, chatId, rewText, rewKb, replyTo);
        break;
      }
    case 'premium':
      {
        if (!await requireUser()) break;
        if (settings.premium_hidden) {
          await tgSend(token, chatId, t(lang, 'premium.unavailable'), replyTo);
          break;
        }
        const products = await base44.asServiceRole.entities.Product.filter({
          active: true,
          category: 'premium'
        });
        if (!products.length) {
          await tgSend(token, chatId, t(lang, 'cmd.noPremium'), replyTo);
          break;
        }
        const keyboard = products.map((p)=>{
          const label = (p.unit_label || '').replace(/Months/i, 'Month');
          return [
            {
              text: `⭐ Premium ${label} $${p.price}`,
              callback_data: `buyprod:${p.id}`
            }
          ];
        });
        await tgSendMenu(token, chatId, `${t(lang, 'premium.title')}\n\n${t(lang, 'premium.prompt')}`, keyboard, replyTo);
        break;
      }
    case 'stars':
      {
        if (!await requireUser()) break;
        if (settings.stars_hidden) {
          await tgSend(token, chatId, t(lang, 'stars.unavailable'), replyTo);
          break;
        }
        const products = await base44.asServiceRole.entities.Product.filter({
          active: true,
          category: 'stars'
        });
        if (!products.length) {
          await tgSend(token, chatId, t(lang, 'cmd.noStars'), replyTo);
          break;
        }
        const buttons = products.map((p)=>({
            text: `${(p.unit_label || '').replace(/\s*Stars?/i, '')} ⭐ $${p.price}`,
            callback_data: `buyprod:${p.id}`
          }));
        const keyboard = [];
        for(let i = 0; i < buttons.length; i += 2)keyboard.push(buttons.slice(i, i + 2));
        await tgSendMenu(token, chatId, `${t(lang, 'stars.title')}\n\n${t(lang, 'premium.prompt')}`, keyboard, replyTo);
        break;
      }
    case 'orders':
      {
        if (!await requireUser()) break;
        await tgSend(token, chatId, await formatOrders(base44, user.email, lang), replyTo);
        break;
      }
    case 'status':
      {
        if (!await requireUser()) break;
        await tgSend(token, chatId, await formatStatus(base44, user.email, lang), replyTo);
        break;
      }
    case 'bind':
      await handleBind(base44, token, chatId, tgUser, lang, findUserByTelegramId);
      break;
    case 'channel':
    case 'support':
      {
        const key = cmd === 'channel' ? 'setting:channel_url' : 'setting:support_url';
        const rec = await getState(base44, key);
        const url = rec ? rec.value : null;
        if (!url) {
          await tgSend(token, chatId, t(lang, `${cmd}.notConfig`), replyTo);
          break;
        }
        await tgSendMenu(token, chatId, `${t(lang, `${cmd}.title`)}\n\n${t(lang, `${cmd}.desc`)}`, [
          [
            {
              text: t(lang, `${cmd}.btn`),
              url
            }
          ]
        ], replyTo);
        break;
      }
    case 'refer':
      {
        if (!await requireUser()) break;
        const refLink = `https://t.me/tgtopsbot?startapp=${user.telegram_id || tgUser.id}`;
        await tgSendMenu(token, chatId, `${t(lang, 'refer.title')}\n\n${t(lang, 'refer.desc')}\n\n${t(lang, 'refer.yourLink')}:\n<code>${refLink}</code>`, [
          [
            { text: t(lang, 'refer.copyBtn'), copy_text: { text: refLink } },
            { text: '📤 Share', switch_inline_query: refLink }
          ]
        ], replyTo);
        break;
      }
    case 'set_channel':
    case 'set_support':
      {
        if (!await requireAdmin()) break;
        if (!parts[1]) {
          await tgSend(token, chatId, `Usage: /${cmd} <url>`, replyTo);
          break;
        }
        await setState(base44, cmd === 'set_channel' ? 'setting:channel_url' : 'setting:support_url', parts[1]);
        await tgSend(token, chatId, `✅ ${cmd === 'set_channel' ? 'Channel' : 'Support'} URL set.`, replyTo);
        break;
      }
    case 'language':
      {
        const keyboard = [];
        for(let i = 0; i < BOT_LANGS.length; i += 2){
          keyboard.push(BOT_LANGS.slice(i, i + 2).map((l)=>({
              text: `${l.flag} ${l.label}`,
              callback_data: `langset:${l.code}`
            })));
        }
        await tgSendMenu(token, chatId, `${t(lang, 'lang.selectTitle')}\n\n${t(lang, 'lang.selectPrompt')}`, keyboard, replyTo);
        break;
      }
    case 'season_gen':
      {
        if (!await requireAdmin()) break;
        await handleSeasonGen(base44, token, chatId, text);
        break;
      }
    case 'adminseason':
      {
        if (!await requireAdmin()) break;
        await setState(base44, `adminseason:${String(tgUser.id)}`, JSON.stringify({
          status: 'awaiting_sessions'
        }));
        await tgSend(token, chatId, `📤 <b>Admin Season Upload</b>\n\nSend a .txt / .json / .zip session file now.\nAccounts go straight to stock — <b>no reward or balance</b> is credited.`, replyTo);
        break;
      }
    case 'uploadsessions':
      {
        if (!await requireAdmin()) break;
        const iso = parts[1]?.toUpperCase();
        if (!iso) {
          await tgSend(token, chatId, 'Usage: /uploadsessions <ISO>\nExample: /uploadsessions US\n\nThen send session strings (one per line).', replyTo);
          break;
        }
        const country = (await base44.asServiceRole.entities.Country.filter({
          iso
        }))[0];
        if (!country) {
          await tgSend(token, chatId, `❌ Country ${iso} not found.`, replyTo);
          break;
        }
        await setState(base44, `upload:${String(tgUser.id)}`, JSON.stringify({
          iso,
          status: 'awaiting_sessions'
        }));
        await tgSend(token, chatId, `📤 <b>Upload Sessions — ${country.flag || ''} ${country.name}</b>\n\nSend session strings now (one per line). Multiple lines allowed.`, replyTo);
        break;
      }
    case 'otp':
      {
        if (!await requireUser()) break;
        const accountId = parts[1];
        if (!accountId) {
          await tgSend(token, chatId, t(lang, 'cmd.otpUsage'), replyTo);
          break;
        }
        await tgSend(token, chatId, t(lang, 'cmd.otpFetching', { id: accountId }), replyTo);
        try {
          const result = await base44.asServiceRole.functions.invoke('fetchOtpCode', {
            account_id: accountId,
            user_email: user.email
          });
          const data = result.data || result;
          if (data.error) throw new Error(data.error);
          await tgSend(token, chatId, t(lang, 'cmd.otpCode', { id: accountId, otp: data.otp_code || data.code || 'N/A', pass: data.pass || 'N/A' }), replyTo);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    case 'buy':
      {
        if (!await requireUser()) break;
        // Direct purchase when args are given: /buy US 2
        if (text.trim().startsWith('/') && parts[1] && parts[2]) {
          const iso = parts[1].toUpperCase();
          const qty = parseInt(parts[2]);
          if (qty > 0) {
            await tgSend(token, chatId, t(lang, 'cmd.purchasing', { qty, iso }), replyTo);
            try {
              const result = await base44.asServiceRole.functions.invoke('purchaseAccount', {
                country_iso: iso,
                quantity: qty,
                user_email: user.email
              });
              const data = result.data || result;
              if (data.error) throw new Error(data.error);
              const accountId = data.first_account_id || data.account_ids && data.account_ids[0];
              const acc = accountId ? (await base44.asServiceRole.entities.TgAccount.filter({
                id: accountId
              }))[0] : null;
              const buyCtry = (await base44.asServiceRole.entities.Country.filter({
                iso,
                platform: 'tg'
              }))[0];
              let msg = `${t(lang, 'mk.purchaseComplete')}\n\n`;
              if (buyCtry) msg += `${buyCtry.flag || '🌍'} <b>${buyCtry.name}</b> (${buyCtry.iso})\n💰 ${t(lang, 'buy.price')}: $${buyCtry.price}\n`;
              msg += `${t(lang, 'cmd.twofaDisabled')}\n`;
              if (acc) msg += `📱 Phone: <code>${acc.phone_number}</code>\n`;
              await tgSend(token, chatId, msg, replyTo);
              if (acc) {
                await tgSendMenu(token, chatId, t(lang, 'cmd.otpMenuTitle'), [
                  [
                    {
                      text: t(lang, 'cmd.requestOtp'),
                      callback_data: `getotp:${acc.id}`
                    }
                  ]
                ], replyTo);
              }
            } catch (err) {
              await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
            }
          }
        } else {
          // Menu press (Market button) — show the market menu, like the app's Market page.
          const { text: mkText, keyboard: mkKb } = await marketMenu(base44, user, lang);
          await tgSendMenu(token, chatId, mkText, mkKb, replyTo);
        }
        break;
      }
    case 'season':
      {
        if (!await requireUser()) break;
        if (!parts[1] || !parts[2]) {
          await tgSend(token, chatId, t(lang, 'cmd.seasonUsage'), replyTo);
          break;
        }
        const iso = parts[1].toUpperCase();
        const qty = parseInt(parts[2]);
        if (qty < 2) {
          await tgSend(token, chatId, t(lang, 'cmd.seasonQtyMin'), replyTo);
          break;
        }
        await tgSend(token, chatId, t(lang, 'cmd.seasonPurchasing', { qty, iso }), replyTo);
        try {
          const { ids: accountIds, error: seasonCmdErr } = await buySeasonInChunks(base44, {
            country_iso: iso,
            user_email: user.email,
            quantity: qty,
            onChunk: qty > 100 ? async ({ done, total })=>{
              await tgSend(token, chatId, t(lang, 'cmd.readyProgress', { done, total }), replyTo);
            } : null
          });
          if (!accountIds.length) throw new Error(seasonCmdErr || 'No accounts could be delivered');
          const seasonCmdCtry = (await base44.asServiceRole.entities.Country.filter({
            iso,
            platform: 'tg'
          }))[0];
          let msg = `${t(lang, 'cmd.seasonDone')}\n\n`;
          if (seasonCmdCtry) {
            msg += `${seasonCmdCtry.flag || '🌍'} <b>${seasonCmdCtry.name}</b> (${iso})\n`;
            msg += `💰 ${t(lang, 'buy.price')}: $${(seasonCmdCtry.price * qty).toFixed(2)}\n`;
          }
          msg += `${t(lang, 'cmd.accountsCount', { count: accountIds.length })}\n`;
          await tgSend(token, chatId, msg, replyTo);
          await deliverSeasonZip(base44, token, chatId, accountIds, replyTo, lang);
          await tgSendMenu(token, chatId, `✅`, [
            [
              {
                text: t(lang, 'buy.buyAgain'),
                callback_data: `buyagainseason:${iso}:${qty}`
              }
            ]
          ], replyTo);
        } catch (err) {
          await tgSend(token, chatId, `❌ Error: ${errText(err)}`, replyTo);
        }
        break;
      }
    case 'topup':
      {
        if (!await requireUser()) break;
        // Backward compat: /topup 50 USDT creates an OKPay order directly.
        if (text.trim().startsWith('/') && parts[1] && parts[2] && /^\d+(\.\d+)?$/.test(parts[1])) {
          const amount = parseFloat(parts[1]);
          const coin = parts[2].toUpperCase();
          if (!amount || amount <= 0) {
            await tgSend(token, chatId, t(lang, 'cmd.invalidAmount'), replyTo);
            break;
          }
          await tgSend(token, chatId, t(lang, 'cmd.creatingOrder', { amount, coin }), replyTo);
          try {
            const result = await base44.asServiceRole.functions.invoke('createOkpayOrder', {
              amount,
              coin,
              user_email: user.email
            });
            const data = result.data || result;
            if (data.error) throw new Error(data.error);
            await tgSend(token, chatId, t(lang, 'cmd.orderCreated', { url: data.pay_url || data.payment_url || data.url || t(lang, 'cmd.checkApp') }), replyTo);
          } catch (err) {
            await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
          }
          break;
        }
        const tpView = topupAmountView(lang);
        await tgSendMenu(token, chatId, tpView.text, tpView.keyboard, replyTo);
        break;
      }
    case 'sell':
      {
        if (!await requireUser()) break;
        await tgSendMenu(token, chatId, `${t(lang, 'sell.menuTitle')}\n\n${t(lang, 'sell.menuPrompt')}`, [
          [
            {
              text: t(lang, 'sell.numberBtn'),
              callback_data: 'sell_number'
            }
          ],
          [
            {
              text: t(lang, 'sell.multiBtn'),
              callback_data: 'sell_multi'
            }
          ]
        ], replyTo);
        break;
      }
    case 'deposit':
      {
        if (!await requireUser()) break;
        if (!parts[1] || !parts[2]) {
          await tgSend(token, chatId, t(lang, 'cmd.depositUsage'), replyTo);
          break;
        }
        const amount = parseFloat(parts[1]);
        if (!amount || amount <= 0) {
          await tgSend(token, chatId, t(lang, 'cmd.invalidAmount'), replyTo);
          break;
        }
        try {
          const result = await base44.asServiceRole.functions.invoke('submitManualTopUp', {
            amount,
            coin: 'USDT',
            tx_hash: parts.slice(2).join(' '),
            user_email: user.email
          });
          const data = result.data || result;
          if (data.error) throw new Error(data.error);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    case 'okpay':
      {
        if (!await requireUser()) break;
        if (!parts[1]) {
          await tgSend(token, chatId, t(lang, 'cmd.okpayUsage'), replyTo);
          break;
        }
        const amount = parseFloat(parts[1]);
        if (!amount || amount <= 0) {
          await tgSend(token, chatId, '❌ Invalid amount.', replyTo);
          break;
        }
        await tgSend(token, chatId, t(lang, 'tu.okpayCreating', { amount }), replyTo);
        try {
          const result = await base44.asServiceRole.functions.invoke('createOkpayOrder', {
            amount,
            coin: 'USDT',
            user_email: user.email
          });
          const data = result.data || result;
          if (data.error) throw new Error(data.error);
          await tgSend(token, chatId, `${t(lang, 'tu.okpayCreated')}\n\n${t(lang, 'cmd.payUrl', { url: data.pay_url || data.payment_url || data.url || t(lang, 'cmd.checkApp') })}`, replyTo);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    case 'withdraw':
      {
        if (!await requireUser()) break;
        // Backward compat: /withdraw 10 <address>
        if (text.trim().startsWith('/') && parts[1] && parts[2] && /^\d+(\.\d+)?$/.test(parts[1])) {
          const amount = parseFloat(parts[1]);
          if (!amount || amount <= 0) {
            await tgSend(token, chatId, t(lang, 'cmd.invalidAmount'), replyTo);
            break;
          }
          try {
            const result = await base44.asServiceRole.functions.invoke('requestWithdrawal', {
              amount,
              wallet_address: parts[2],
              user_email: user.email
            });
            const data = result.data || result;
            if (data.error) throw new Error(data.error);
          } catch (err) {
            await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
          }
          break;
        }
        const bal = await getRealBalance(base44, user.email);
        const wdView = withdrawAmountView(bal, lang);
        await tgSendMenu(token, chatId, wdView.text, wdView.keyboard, replyTo);
        break;
      }
    case 'session':
      {
        if (!await requireUser()) break;
        if (!parts[1]) {
          await tgSend(token, chatId, t(lang, 'cmd.sessionUsage'), replyTo);
          break;
        }
        const phone = parts[1];
        await tgSend(token, chatId, t(lang, 'cmd.sendingCode', { phone }), replyTo);
        try {
          const result = await base44.asServiceRole.functions.invoke('sendLoginCode', {
            phone_number: phone,
            user_email: user.email
          });
          const data = result.data || result;
          if (data.error) throw new Error(data.error);
          await setState(base44, `session:${user.email}`, JSON.stringify({
            phone,
            request_id: data.request_id,
            status: 'code_sent'
          }));
          await tgSend(token, chatId, t(lang, 'cmd.codeSentReply', { phone }), replyTo);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    case 'verify':
      {
        if (!await requireUser()) break;
        const stateRec = await getState(base44, `session:${user.email}`);
        if (!stateRec) {
          await tgSend(token, chatId, t(lang, 'cmd.noActiveSession'), replyTo);
          break;
        }
        const sessionState = JSON.parse(stateRec.value);
        if (!parts[1]) {
          await tgSend(token, chatId, t(lang, 'cmd.verifyUsage'), replyTo);
          break;
        }
        await tgSend(token, chatId, `🔄 Verifying code...`, replyTo);
        try {
          const result = await base44.asServiceRole.functions.invoke('verifyLoginCode', {
            request_id: sessionState.request_id,
            phone_code: parts[1],
            user_email: user.email
          });
          const data = result.data || result;
          if (data.error) throw new Error(data.error);
          await clearState(base44, `session:${user.email}`);
          await tgSend(token, chatId, `${t(lang, 'sf.received')}\n\n${t(lang, 'sf.country', { flag: '', country: `${data.country || ''}${data.country_iso ? ` (${data.country_iso})` : ''}` })}\n${t(lang, 'mk.phone', { phone: data.phone || '' })}\n\n${t(lang, 'sf.addedToStock')}`, replyTo);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    case 'password':
      {
        if (!await requireUser()) break;
        await clearState(base44, `session:${user.email}`);
        await tgSend(token, chatId, t(lang, 'cmd.twofaExplainer'), replyTo);
        break;
      }
    case 'admin':
      {
        if (!await requireAdmin()) break;
        await tgSend(token, chatId, `🔧 <b>Admin Commands</b>\n\n` + `• /pending — View & approve/reject pending requests\n` + `• /approve_topup [id] [approve/reject]\n` + `• /approve_withdrawal [id] [approve/reject]\n` + `• /add_balance [email] [amount]\n` + `• /ban [email] [ban/unban]\n` + `• /userhistory [email] — View any user's purchase history\n` + `• /process_rewards\n` + `• /season_gen [ISO]`, replyTo);
        break;
      }
    case 'userhistory':
      {
        if (!await requireAdmin()) break;
        if (!parts[1]) {
          await tgSend(token, chatId, 'Usage: /userhistory [email]', replyTo);
          break;
        }
        const targetEmail = parts[1].toLowerCase();
        const targetUsers = await base44.asServiceRole.entities.User.list();
        if (!targetUsers.find((u)=>(u.email || '').toLowerCase() === targetEmail)) {
          await tgSend(token, chatId, `❌ User ${targetEmail} not found.`, replyTo);
          break;
        }
        await tgSend(token, chatId, await formatOrders(base44, targetEmail, lang), replyTo);
        break;
      }
    case 'pending':
      {
        if (!await requireAdmin()) break;
        const [topups, withdrawals] = await Promise.all([
          base44.asServiceRole.entities.TopUp.filter({
            status: 'pending'
          }),
          base44.asServiceRole.entities.Withdrawal.filter({
            status: 'pending'
          })
        ]);
        if (!topups.length && !withdrawals.length) {
          await tgSend(token, chatId, '✅ <b>No pending requests.</b>', replyTo);
          break;
        }
        if (topups.length) {
          const keyboard = topups.map((tp)=>[
              [
                {
                  text: `✅ Approve`,
                  callback_data: `admintopup:${tp.id}:approved`
                },
                {
                  text: `❌ Reject`,
                  callback_data: `admintopup:${tp.id}:rejected`
                }
              ]
            ]);
          const list = topups.map((tp)=>`• <code>${tp.id.slice(-8)}</code> | ${tp.user_email} | $${Number(tp.amount).toFixed(2)} ${tp.coin}`).join('\n');
          await tgSendMenu(token, chatId, `💳 <b>Pending Top-ups (${topups.length})</b>\n\n${list}\n\nTap a button to decide:`, keyboard, replyTo);
        }
        if (withdrawals.length) {
          const keyboard = withdrawals.map((w)=>[
              [
                {
                  text: `✅ Approve`,
                  callback_data: `adminwithdraw:${w.id}:approved`
                },
                {
                  text: `❌ Reject`,
                  callback_data: `adminwithdraw:${w.id}:rejected`
                }
              ]
            ]);
          const list = withdrawals.map((w)=>`• <code>${w.id.slice(-8)}</code> | ${w.user_email} | $${Number(w.amount).toFixed(2)} USDT`).join('\n');
          await tgSendMenu(token, chatId, `💸 <b>Pending Withdrawals (${withdrawals.length})</b>\n\n${list}\n\nTap a button to decide:`, keyboard, replyTo);
        }
        break;
      }
    case 'approve_topup':
    case 'approve_withdrawal':
      {
        if (!await requireAdmin()) break;
        if (!parts[1] || !parts[2]) {
          await tgSend(token, chatId, `Usage: /${cmd} [id] [approve/reject]`, replyTo);
          break;
        }
        const status = parts[2] === 'approve' ? 'approved' : parts[2] === 'reject' ? 'rejected' : parts[2];
        const isTopUp = cmd === 'approve_topup';
        try {
          const result = await base44.asServiceRole.functions.invoke(isTopUp ? 'approveTopUp' : 'approveWithdrawal', isTopUp ? {
            topup_id: parts[1],
            status
          } : {
            withdrawal_id: parts[1],
            status
          });
          const data = result.data || result;
          await tgSend(token, chatId, data.error ? `❌ ${data.error}` : `✅ ${isTopUp ? 'Top-up' : 'Withdrawal'} ${parts[2]}d.`, replyTo);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    case 'add_balance':
      {
        if (!await requireAdmin()) break;
        if (!parts[1] || !parts[2]) {
          await tgSend(token, chatId, 'Usage: /add_balance [email] [amount]', replyTo);
          break;
        }
        try {
          const result = await base44.asServiceRole.functions.invoke('addUserBalance', {
            user_email: parts[1],
            amount: parseFloat(parts[2])
          });
          const data = result.data || result;
          await tgSend(token, chatId, data.error ? `❌ ${data.error}` : `✅ Balance updated for ${parts[1]}.`, replyTo);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    case 'ban':
      {
        if (!await requireAdmin()) break;
        if (!parts[1] || !parts[2]) {
          await tgSend(token, chatId, 'Usage: /ban [email] [ban/unban]', replyTo);
          break;
        }
        try {
          const result = await base44.asServiceRole.functions.invoke('banUser', {
            user_email: parts[1],
            action: parts[2]
          });
          const data = result.data || result;
          await tgSend(token, chatId, data.error ? `❌ ${data.error}` : `✅ User ${parts[2]}ed.`, replyTo);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    case 'process_rewards':
      {
        if (!await requireAdmin()) break;
        try {
          const result = await base44.asServiceRole.functions.invoke('processPendingRewards', {});
          const data = result.data || result;
          await tgSend(token, chatId, `✅ Rewards processed: ${JSON.stringify(data).slice(0, 300)}`, replyTo);
        } catch (err) {
          await tgSend(token, chatId, t(lang, 'c.error', { msg: err.message }), replyTo);
        }
        break;
      }
    default:
      {
        const rawText = text.trim();
        if (cmd && rawText.startsWith('/')) {
          await tgSend(token, chatId, t(lang, 'cmd.unknownCmd', { cmd }), replyTo);
          break;
        }
        // A short alphanumeric message may be an app bind code.
        if (!rawText.startsWith('/') && rawText.length >= 4 && rawText.length <= 12 && /^[A-Za-z0-9]+$/.test(rawText)) {
          const matchUser = await findUserByBindCode(base44, rawText);
          if (matchUser) {
            await base44.asServiceRole.entities.User.update(matchUser.id, {
              telegram_id: String(tgUser.id),
              telegram_username: tgUser.username || '',
              telegram_first_name: tgUser.first_name || '',
              telegram_last_name: tgUser.last_name || '',
              telegram_bind_code: ''
            });
            await tgSend(token, chatId, t(lang, 'cmd.linked', { email: matchUser.email }), replyTo);
          } else if (cmd) {
            await tgSend(token, chatId, t(lang, 'cmd.unknownCmd', { cmd }), replyTo);
          }
        }
        break;
      }
  }
}