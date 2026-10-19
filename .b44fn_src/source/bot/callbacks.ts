import { t, langName, BOT_LANGS } from '../_shared/botTranslations.js';
import { tgSend, tgDeleteMessage, tgSendMenu, tgAnswerCallback, tgEditMenu } from '../_shared/telegramApi.ts';
import { getRealBalance } from '../_shared/balance.ts';
import { buildRewardsPage, buildUserRewards } from '../_shared/rewardViews.js';
import { buySeasonInChunks } from '../_shared/seasonBuy.js';
import { getState, setState, clearState, getUserContext, findUserByTelegramId } from './state.ts';
import { mainMenuKeyboard, buildCountryKeyboard, DEPOSIT_ADDRESSES } from './keyboards.ts';
import { handleMarketCallback, marketMenu } from './market.ts';
import { handleTopupCallback, topupAmountView } from './topup.ts';
import { handleWithdrawCallback, withdrawAmountView } from './withdraw.ts';
import { formatOrders, formatStatus, formatProducts } from './views.ts';
import { deliverSeasonZip, handleBind, errText } from './delivery.ts';
// Handles every inline-keyboard button press. Direct port of the callback
// section of the Base44 bot handler.
export default async function handleCallback(base44, token, cq) {
  const cbChatId = cq.message?.chat?.id;
  const cbMsgId = cq.message?.message_id;
  let cbData = cq.data || '';
  // "Buy Again" reuses the original purchase actions.
  if (cbData.startsWith('buyagain1:')) cbData = cbData.replace('buyagain1:', 'buy1:');
  if (cbData.startsWith('buyagainseason:')) cbData = cbData.replace('buyagainseason:', 'seasonconfirm:');
  const cbUser = cq.from;
  await tgAnswerCallback(token, cq.id);
  // Same behaviour as the language picker: as soon as a pressed button leads to
  // a brand-new message, the old button message is removed — only the resulting
  // message stays. In-place menu navigation (tgEditMenu) keeps its message.
  let hostDeleted = false;
  const dropHost = async ()=>{
    if (hostDeleted || !cbMsgId) return;
    hostDeleted = true;
    try {
      await tgDeleteMessage(token, cbChatId, cbMsgId);
    } catch  {}
  };
  const send = async (chatId, text, replyTo)=>{
    await dropHost();
    return tgSend(token, chatId, text, replyTo);
  };
  const sendMenu = async (chatId, text, keyboard)=>{
    await dropHost();
    return tgSendMenu(token, chatId, text, keyboard);
  };
  const [cbUserRec, cbCtx] = await Promise.all([
    cbUser ? findUserByTelegramId(base44, String(cbUser.id)) : Promise.resolve(null),
    getUserContext(base44, String(cbUser.id))
  ]);
  const cbLang = cbCtx.lang;
  const cbSettings = cbCtx.settings;
  // Maintenance mode blocks everyone but admins.
  if (cbSettings.maintenance_mode && (!cbUserRec || cbUserRec.role !== 'admin')) {
    await send(cbChatId, `${t(cbLang, 'maintenance.title')}\n\n${cbSettings.maintenance_message || t(cbLang, 'maintenance.body')}`);
    return;
  }
  // Market — mirrors the app's Market page (sellers → countries → buy).
  if (cbData.startsWith('mk_')) {
    await handleMarketCallback(base44, token, cq, cbUserRec, cbLang, cbChatId, cbMsgId);
    return;
  }
  // Top Up wizard — mirrors the app's Top Up (amount → method → network → deposit).
  if (cbData.startsWith('tp_')) {
    await handleTopupCallback(base44, token, cq, cbUserRec, cbLang, cbChatId, cbMsgId);
    return;
  }
  // Withdraw wizard — mirrors the app's Withdraw (amount → network → address).
  if (cbData.startsWith('wd_')) {
    await handleWithdrawCallback(base44, token, cq, cbUserRec, cbLang, cbChatId, cbMsgId);
    return;
  }
  if (cbData.startsWith('buyctry:')) {
    const iso = cbData.split(':')[1];
    const countries = await base44.asServiceRole.entities.Country.filter({
      iso,
      active: true,
      platform: 'tg'
    });
    const country = countries[0];
    if (!country) {
      await send(cbChatId, `❌ Country ${iso} not found.`);
      return;
    }
    const bal = cbUserRec ? await getRealBalance(base44, cbUserRec.email) : 0;
    await tgEditMenu(token, cbChatId, cbMsgId, `${country.flag || '🌍'} <b>${country.name}</b> (${country.iso})\n\n${t(cbLang, 'buy.price')}: $${country.price}/account\n${t(cbLang, 'buy.stock')}: ${country.stock || 0}\n${t(cbLang, 'buy.yourBalance')}: $${bal.toFixed(2)}\n\n${t(cbLang, 'buy.chooseType')}`, [
      [
        {
          text: `${t(cbLang, 'buy.buy1')} ($${country.price})`,
          callback_data: `buy1:${iso}`
        }
      ],
      [
        {
          text: t(cbLang, 'buy.season'),
          callback_data: `buyseason:${iso}`
        }
      ],
      [
        {
          text: t(cbLang, 'buy.back'),
          callback_data: 'buy_list'
        }
      ]
    ]);
    return;
  }
  if (cbData.startsWith('buy1:')) {
    const iso = cbData.split(':')[1];
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    const countries = await base44.asServiceRole.entities.Country.filter({
      iso,
      active: true,
      platform: 'tg'
    });
    const country = countries[0];
    if (!country) {
      await send(cbChatId, `❌ Country ${iso} not found.`);
      return;
    }
    if ((country.stock || 0) < 1) {
      await sendMenu(cbChatId, t(cbLang, 'buy.outOfStock'), [
        [
          {
            text: t(cbLang, 'buy.back'),
            callback_data: `buyctry:${iso}`
          }
        ]
      ]);
      return;
    }
    const bal = await getRealBalance(base44, cbUserRec.email);
    if (bal < country.price) {
      await sendMenu(cbChatId, `${t(cbLang, 'buy.insufficientBalance')}\n\n${t(cbLang, 'buy.insufficientBalanceDesc', {
        balance: bal.toFixed(2),
        price: country.price.toFixed(2)
      })}`, [
        [
          {
            text: t(cbLang, 'buy.back'),
            callback_data: `buyctry:${iso}`
          }
        ]
      ]);
      return;
    }
    await send(cbChatId, t(cbLang, 'buy.purchasing1', {
      iso
    }));
    try {
      const result = await base44.asServiceRole.functions.invoke('purchaseAccount', {
        country_iso: iso,
        quantity: 1,
        user_email: cbUserRec.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      const accountId = data.first_account_id || data.account_ids && data.account_ids[0];
      const accounts = accountId ? await base44.asServiceRole.entities.TgAccount.filter({
        id: accountId
      }) : [];
      const account = accounts[0];
      if (account) {
        let msg = `${t(cbLang, 'buy.purchaseDone')}\n\n`;
        msg += `${country.flag || '🌍'} <b>${country.name}</b> (${country.iso})\n`;
        msg += `💰 ${t(cbLang, 'buy.price')}: $${country.price}\n`;
        msg += `🛡️ 2FA: <b>Disabled</b>\n`;
        msg += `${t(cbLang, 'buy.phone')}: <code>${account.phone_number}</code>\n`;
        // OTP button rides along on the purchase message.
        await sendMenu(cbChatId, msg, [
          [
            {
              text: t(cbLang, 'buy.otpBtn'),
              callback_data: `getotp:${account.id}`
            }
          ]
        ]);
      } else {
        await send(cbChatId, `${t(cbLang, 'buy.purchaseDone')}\n${t(cbLang, 'buy.account')}: <code>${accountId || 'N/A'}</code>`);
      }
    } catch (err) {
      await send(cbChatId, `❌ Error: ${err.message}`);
    }
    return;
  }
  if (cbData.startsWith('buyseason:')) {
    const iso = cbData.split(':')[1];
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    const countries = await base44.asServiceRole.entities.Country.filter({
      iso,
      active: true,
      platform: 'tg'
    });
    const country = countries[0];
    if (!country) {
      await send(cbChatId, `❌ Country ${iso} not found.`);
      return;
    }
    const bal = await getRealBalance(base44, cbUserRec.email);
    const qtyButtons = [
      5,
      10,
      20,
      50,
      100,
      200,
      500,
      1000
    ];
    const keyboard = [];
    for(let i = 0; i < qtyButtons.length; i += 4){
      keyboard.push(qtyButtons.slice(i, i + 4).map((q)=>({
          text: `📦 ${q}`,
          callback_data: `seasonqty:${iso}:${q}`
        })));
    }
    keyboard.push([
      {
        text: t(cbLang, 'buy.seasonCustom'),
        callback_data: `seasoncustom:${iso}`
      }
    ]);
    keyboard.push([
      {
        text: t(cbLang, 'buy.back'),
        callback_data: `buyctry:${iso}`
      }
    ]);
    await tgEditMenu(token, cbChatId, cbMsgId, t(cbLang, 'buy.seasonTitle', {
      name: country.name,
      iso: country.iso,
      price: country.price,
      stock: country.stock || 0,
      balance: bal.toFixed(2)
    }) + '\n\n' + t(cbLang, 'buy.seasonPrompt'), keyboard);
    return;
  }
  if (cbData.startsWith('rewpage:')) {
    const page = parseInt(cbData.split(':')[1]) || 1;
    const { text, keyboard } = await buildRewardsPage(base44, cbLang, page);
    await tgEditMenu(token, cbChatId, cbMsgId, text, keyboard);
    return;
  }
  if (cbData === 'buysearch') {
    await setState(base44, `buysearch:${String(cbUser.id)}`, 'active');
    await send(cbChatId, t(cbLang, 'buy.searchPrompt'));
    return;
  }
  if (cbData.startsWith('buypage:')) {
    const page = parseInt(cbData.split(':')[1]) || 1;
    const queryRec = await getState(base44, `buypage_query:${String(cbUser.id)}`);
    const query = queryRec ? queryRec.value : null;
    const countries = await base44.asServiceRole.entities.Country.filter({
      active: true,
      platform: 'tg'
    });
    if (!countries.length) {
      await send(cbChatId, '❌ No countries available.');
      return;
    }
    await tgEditMenu(token, cbChatId, cbMsgId, query ? t(cbLang, 'buy.searchResult', {
      query
    }) : `${t(cbLang, 'buy.title')}\n\n${t(cbLang, 'buy.prompt')}`, buildCountryKeyboard(countries, cbLang, query, page));
    return;
  }
  if (cbData === 'buy_list') {
    await clearState(base44, `buypage_query:${String(cbUser.id)}`);
    const countries = await base44.asServiceRole.entities.Country.filter({
      active: true,
      platform: 'tg'
    });
    if (!countries.length) {
      await send(cbChatId, '❌ No countries available.');
      return;
    }
    await tgEditMenu(token, cbChatId, cbMsgId, `🌍 <b>Market — Buy Accounts</b>\n\nTap a country:`, buildCountryKeyboard(countries, cbLang, null, 1));
    return;
  }
  if (cbData.startsWith('admintopup:') || cbData.startsWith('adminwithdraw:')) {
    const [kind, recordId, status] = cbData.split(':');
    if (!cbUserRec || cbUserRec.role !== 'admin') {
      await send(cbChatId, '⚠️ Admin only.');
      return;
    }
    await tgAnswerCallback(token, cq.id, 'Processing...');
    const isTopUp = kind === 'admintopup';
    try {
      const result = await base44.asServiceRole.functions.invoke(isTopUp ? 'approveTopUp' : 'approveWithdrawal', isTopUp ? {
        topup_id: recordId,
        status
      } : {
        withdrawal_id: recordId,
        status
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      await tgEditMenu(token, cbChatId, cbMsgId, `${status === 'approved' ? '✅' : '❌'} <b>${isTopUp ? 'Top-up' : 'Withdrawal'} ${status}</b>\n\nID: <code>${recordId.slice(-8)}</code>\nUser: ${data.user_email || ''}\nBalance: $${data.balance || ''}`, []);
    } catch (err) {
      await send(cbChatId, `❌ Error: ${err.message}`);
    }
    return;
  }
  if (cbData.startsWith('langset:')) {
    const langCode = cbData.split(':')[1];
    await setState(base44, `lang:${String(cbUser.id)}`, langCode);
    const name = langName(langCode);
    await tgAnswerCallback(token, cq.id, `✅ ${name}`);
    await sendMenu(cbChatId, t(langCode, 'lang.set', {
      name
    }) + '\n\n' + t(langCode, 'menu.title') + '\n' + t(langCode, 'menu.prompt'), mainMenuKeyboard(langCode, {
      hidePremium: cbSettings.premium_hidden,
      hideStars: cbSettings.stars_hidden
    }));
    return;
  }
  if (cbData.startsWith('buyprodconfirm:')) {
    const productId = cbData.split(':')[1];
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    const products = await base44.asServiceRole.entities.Product.filter({
      id: productId
    });
    const product = products[0];
    if (!product) {
      await send(cbChatId, '❌ Product not found.');
      return;
    }
    const bal = await getRealBalance(base44, cbUserRec.email);
    if (bal < product.price) {
      await sendMenu(cbChatId, `${t(cbLang, 'buy.prodInsufficientBalance')}\n\n${t(cbLang, 'buy.prodInsufficientBalanceDesc', {
        balance: bal.toFixed(2),
        price: product.price.toFixed(2)
      })}`, [
        [
          {
            text: t(cbLang, 'buy.back'),
            callback_data: product.category === 'premium' ? 'menu_premium' : 'menu_stars'
          }
        ]
      ]);
      return;
    }
    await send(cbChatId, t(cbLang, 'buy.prodPurchasing'));
    try {
      const result = await base44.asServiceRole.functions.invoke('purchaseProduct', {
        product_id: productId,
        user_email: cbUserRec.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      await send(cbChatId, `${t(cbLang, 'buy.prodDone')}\n\nProduct: ${data.product_name}\nPrice: $${data.price || ''}\n\nThis product will be sent to your account soon.`);
    } catch (err) {
      await send(cbChatId, `❌ Error: ${err.message}`);
    }
    return;
  }
  if (cbData.startsWith('buyprod:')) {
    const productId = cbData.split(':')[1];
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    const products = await base44.asServiceRole.entities.Product.filter({
      id: productId
    });
    const product = products[0];
    if (!product) {
      await send(cbChatId, '❌ Product not found.');
      return;
    }
    const bal = await getRealBalance(base44, cbUserRec.email);
    await tgEditMenu(token, cbChatId, cbMsgId, `${t(cbLang, 'buy.prodConfirmTitle')}\n\n${t(cbLang, 'buy.prodConfirmProduct', {
      name: product.name
    })}\n${t(cbLang, 'buy.prodConfirmPrice', {
      price: product.price.toFixed(2)
    })}\n${t(cbLang, 'buy.prodConfirmBalance', {
      balance: bal.toFixed(2)
    })}`, [
      [
        {
          text: t(cbLang, 'buy.prodConfirmBtn'),
          callback_data: `buyprodconfirm:${productId}`
        }
      ],
      [
        {
          text: t(cbLang, 'buy.back'),
          callback_data: product.category === 'premium' ? 'menu_premium' : 'menu_stars'
        }
      ]
    ]);
    return;
  }
  if (cbData.startsWith('seasonqty:')) {
    const parts = cbData.split(':');
    const iso = parts[1];
    const qty = parseInt(parts[2]);
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    const countries = await base44.asServiceRole.entities.Country.filter({
      iso,
      active: true,
      platform: 'tg'
    });
    const country = countries[0];
    if (!country) {
      await send(cbChatId, `❌ Country ${iso} not found.`);
      return;
    }
    const stock = country.stock || 0;
    const bal = await getRealBalance(base44, cbUserRec.email);
    const total = Number((country.price * qty).toFixed(2));
    if (stock < qty) {
      await send(cbChatId, t(cbLang, 'buy.seasonInsufficientStock', {
        available: stock,
        qty
      }));
      return;
    }
    if (bal < total) {
      await sendMenu(cbChatId, `${t(cbLang, 'buy.seasonInsufficientBalance')}\n\n${t(cbLang, 'buy.seasonInsufficientBalanceDesc', {
        balance: bal.toFixed(2),
        total: total.toFixed(2)
      })}`, [
        [
          {
            text: t(cbLang, 'buy.back'),
            callback_data: `buyseason:${iso}`
          }
        ]
      ]);
      return;
    }
    await tgEditMenu(token, cbChatId, cbMsgId, `${t(cbLang, 'buy.seasonConfirmTitle')}\n\n${country.flag || '🌍'} <b>${country.name}</b> (${iso})\n${t(cbLang, 'buy.seasonConfirmQty', {
      qty
    })}\n${t(cbLang, 'buy.seasonConfirmCost', {
      total: total.toFixed(2)
    })}\n${t(cbLang, 'buy.seasonConfirmBalance', {
      balance: bal.toFixed(2)
    })}`, [
      [
        {
          text: t(cbLang, 'buy.seasonConfirmBtn'),
          callback_data: `seasonconfirm:${iso}:${qty}`
        }
      ],
      [
        {
          text: t(cbLang, 'buy.back'),
          callback_data: `buyseason:${iso}`
        }
      ]
    ]);
    return;
  }
  if (cbData.startsWith('seasoncustom:')) {
    const iso = cbData.split(':')[1];
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    await setState(base44, `season:${String(cbUser.id)}`, JSON.stringify({
      iso,
      status: 'awaiting_qty'
    }));
    await send(cbChatId, t(cbLang, 'buy.seasonCustomPrompt'));
    return;
  }
  if (cbData.startsWith('seasonconfirm:')) {
    const parts = cbData.split(':');
    const iso = parts[1];
    const qty = parseInt(parts[2]);
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    await send(cbChatId, t(cbLang, 'buy.seasonPurchasing', {
      qty,
      iso
    }));
    try {
      // Bought in chunks with progress updates — any size, no timeout.
      const { ids: accountIds, error: seasonErr } = await buySeasonInChunks(base44, {
        country_iso: iso,
        user_email: cbUserRec.email,
        quantity: qty,
        onChunk: qty > 100 ? async ({ done, total })=>{
          await send(cbChatId, `⏳ ${done}/${total} accounts ready…`);
        } : null
      });
      if (!accountIds.length) throw new Error(seasonErr || 'No accounts could be delivered');
      try {
        await tgDeleteMessage(token, cbChatId, cbMsgId);
      } catch  {}
      const seasonCountry = (await base44.asServiceRole.entities.Country.filter({
        iso,
        platform: 'tg'
      }))[0];
      let msg = `${t(cbLang, 'buy.seasonDone')}\n\n`;
      if (seasonCountry) {
        msg += `${seasonCountry.flag || '🌍'} <b>${seasonCountry.name}</b> (${iso})\n`;
        msg += `💰 ${t(cbLang, 'buy.price')}: $${(seasonCountry.price * qty).toFixed(2)}\n`;
      }
      msg += `${t(cbLang, 'buy.seasonAccounts')}: ${accountIds.length}\n`;
      if (accountIds.length < qty) msg += `⚠️ ${qty - accountIds.length} could not be delivered (not charged)\n`;
      await send(cbChatId, msg);
      await deliverSeasonZip(base44, token, cbChatId, accountIds);
      await sendMenu(cbChatId, `✅`, [
        [
          {
            text: t(cbLang, 'buy.buyAgain'),
            callback_data: `buyagainseason:${iso}:${qty}`
          }
        ]
      ]);
    } catch (err) {
      await send(cbChatId, `❌ Error: ${errText(err)}`);
    }
    return;
  }
  if (cbData.startsWith('getotp:')) {
    const accountId = cbData.split(':')[1];
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    const fetchingMsg = await send(cbChatId, t(cbLang, 'buy.otpFetching'));
    const fetchingMsgId = fetchingMsg?.result?.message_id;
    try {
      const result = await base44.asServiceRole.functions.invoke('fetchOtpCode', {
        account_id: accountId,
        user_email: cbUserRec.email
      });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      const acc = (await base44.asServiceRole.entities.TgAccount.filter({
        id: accountId
      }))[0];
      try {
        if (fetchingMsgId) await tgDeleteMessage(token, cbChatId, fetchingMsgId);
      } catch  {}
      await sendMenu(cbChatId, `${t(cbLang, 'buy.otpResult')}\n\n${t(cbLang, 'buy.account')}: <code>${accountId}</code>\n${t(cbLang, 'buy.otpCode')}: <code>${data.code || data.otp_code || 'N/A'}</code>\n${t(cbLang, 'buy.otpPass')}: <code>${data.pass || 'N/A'}</code>`, [
        [
          {
            text: t(cbLang, 'buy.buyAgain'),
            callback_data: `buyagain1:${acc?.country_iso || ''}`
          }
        ]
      ]);
    } catch (err) {
      try {
        if (fetchingMsgId) await tgDeleteMessage(token, cbChatId, fetchingMsgId);
      } catch  {}
      await send(cbChatId, t(cbLang, 'buy.otpError'));
    }
    return;
  }
  if (cbData === 'sell_number') {
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    await setState(base44, `sell:${String(cbUser.id)}`, JSON.stringify({
      status: 'awaiting_phone'
    }));
    await send(cbChatId, `${t(cbLang, 'sell.title')}\n\n${t(cbLang, 'sell.prompt')}`);
    return;
  }
  if (cbData === 'sell_season') {
    if (!cbUserRec) {
      await send(cbChatId, t(cbLang, 'bind.required'));
      return;
    }
    await setState(base44, `sellseason:${String(cbUser.id)}`, JSON.stringify({
      status: 'awaiting_sessions'
    }));
    await send(cbChatId, t(cbLang, 'sell.seasonPrompt'));
    return;
  }
  switch(cbData){
    case 'menu_main':
      await tgEditMenu(token, cbChatId, cbMsgId, t(cbLang, 'menu.mainMsg'), mainMenuKeyboard(cbLang, {
        hidePremium: cbSettings.premium_hidden,
        hideStars: cbSettings.stars_hidden
      }));
      break;
    case 'menu_buy':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const market = await marketMenu(base44, cbUserRec);
        await tgEditMenu(token, cbChatId, cbMsgId, market.text, market.keyboard);
        break;
      }
    case 'buy_single':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        await clearState(base44, `buypage_query:${String(cbUser.id)}`);
        const countries = await base44.asServiceRole.entities.Country.filter({
          active: true,
          platform: 'tg'
        });
        if (!countries.length) {
          await send(cbChatId, '❌ No countries available.');
          break;
        }
        await sendMenu(cbChatId, `${t(cbLang, 'buy.title')}\n\n${t(cbLang, 'buy.prompt')}`, buildCountryKeyboard(countries, cbLang, null, 1));
        break;
      }
    case 'buy_season':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        await send(cbChatId, `📦 <b>Season Purchase</b>\n\nUsage: <code>/season [ISO] [quantity>1]</code>\nExample: <code>/season US 5</code>`);
        break;
      }
    case 'menu_balance':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const bal = await getRealBalance(base44, cbUserRec.email);
        await send(cbChatId, `${t(cbLang, 'balance.title')}\n\n$${bal.toFixed(2)}`);
        break;
      }
    case 'menu_topup':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const v = topupAmountView();
        await tgEditMenu(token, cbChatId, cbMsgId, v.text, v.keyboard);
        break;
      }
    case 'topup_usdt':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const topupStateRec = await getState(base44, `topup:${String(cbUser.id)}`);
        if (!topupStateRec) {
          await send(cbChatId, '❌ Session expired. Use /topup again.');
          break;
        }
        const topupState = JSON.parse(topupStateRec.value);
        const amount = topupState.amount;
        const addressKeyboard = DEPOSIT_ADDRESSES.map((a)=>[
            {
              text: `📋 Copy ${a.label}`,
              copy_text: {
                text: a.address
              }
            }
          ]);
        const addrMsg = await sendMenu(cbChatId, `📋 <b>Manual Deposit — $${amount} USDT</b>\n\nSend exactly $${amount} USDT to one of these addresses. Tap a button to copy:\n\nAfter sending, reply with your <b>TXID</b> (transaction hash).`, addressKeyboard);
        await setState(base44, `topup:${String(cbUser.id)}`, JSON.stringify({
          amount,
          status: 'awaiting_txid',
          msgs: [
            ...topupState.msgs || [],
            cbMsgId,
            addrMsg?.result?.message_id
          ].filter(Boolean)
        }));
        break;
      }
    case 'topup_okpay':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const topupStateRec = await getState(base44, `topup:${String(cbUser.id)}`);
        if (!topupStateRec) {
          await send(cbChatId, '❌ Session expired. Use /topup again.');
          break;
        }
        const amount = JSON.parse(topupStateRec.value).amount;
        await send(cbChatId, `🔄 Creating OKPay order for $${amount}...`);
        try {
          const result = await base44.asServiceRole.functions.invoke('createOkpayOrder', {
            amount,
            coin: 'USDT',
            user_email: cbUserRec.email
          });
          const data = result.data || result;
          if (data.error) throw new Error(data.error);
          const payUrl = data.pay_url || data.payment_url || data.url;
          if (payUrl) {
            await sendMenu(cbChatId, `✅ <b>OKPay Order Created</b>\n\nAmount: $${amount}\n\nTap the button below to pay:`, [
              [
                {
                  text: '⚡ Pay with OKPay',
                  url: payUrl
                }
              ]
            ]);
          } else {
            await send(cbChatId, `✅ <b>OKPay Order Created</b>\n\nAmount: $${amount}\nCheck app for payment link.`);
          }
          await clearState(base44, `topup:${String(cbUser.id)}`);
        } catch (err) {
          await send(cbChatId, `❌ Error: ${err.message}`);
        }
        break;
      }
    case 'menu_status':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        await send(cbChatId, await formatStatus(base44, cbUserRec.email, cbLang));
        break;
      }
    case 'menu_orders':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        await send(cbChatId, await formatOrders(base44, cbUserRec.email, cbLang));
        break;
      }
    case 'menu_premium':
      {
        if (cbSettings.premium_hidden) {
          await send(cbChatId, t(cbLang, 'premium.unavailable'));
          break;
        }
        await send(cbChatId, await formatProducts(base44, 'premium', cbLang));
        break;
      }
    case 'menu_stars':
      {
        if (cbSettings.stars_hidden) {
          await send(cbChatId, t(cbLang, 'stars.unavailable'));
          break;
        }
        await send(cbChatId, await formatProducts(base44, 'stars', cbLang));
        break;
      }
    case 'menu_bind':
      await dropHost();
      await handleBind(base44, token, cbChatId, cbUser, cbLang, findUserByTelegramId);
      break;
    case 'menu_help':
      await send(cbChatId, `${t(cbLang, 'help.title')}\n\n${t(cbLang, 'help.body')}`);
      break;
    case 'menu_sell':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        await sendMenu(cbChatId, `${t(cbLang, 'sell.menuTitle')}\n\n${t(cbLang, 'sell.menuPrompt')}`, [
          [
            {
              text: t(cbLang, 'sell.numberBtn'),
              callback_data: 'sell_number'
            }
          ],
          [
            {
              text: t(cbLang, 'sell.seasonBtn'),
              callback_data: 'sell_season'
            }
          ],
          [
            {
              text: t(cbLang, 'buy.back'),
              callback_data: 'menu_main'
            }
          ]
        ]);
        break;
      }
    case 'menu_myaccount':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const [accounts, sessions, topups, withdrawals] = await Promise.all([
          base44.asServiceRole.entities.TgAccount.filter({
            owner_email: cbUserRec.email
          }),
          base44.asServiceRole.entities.SessionRequest.filter({
            user_email: cbUserRec.email,
            status: 'completed'
          }),
          base44.asServiceRole.entities.TopUp.filter({
            user_email: cbUserRec.email,
            status: 'approved'
          }),
          base44.asServiceRole.entities.Withdrawal.filter({
            user_email: cbUserRec.email
          })
        ]);
        const bal = await getRealBalance(base44, cbUserRec.email);
        const totalDeposits = topups.reduce((sum, tp)=>sum + (tp.amount || 0), 0);
        const totalWithdrawals = withdrawals.filter((w)=>w.status === 'approved').reduce((sum, w)=>sum + (w.amount || 0), 0);
        const totalReward = sessions.filter((s)=>s.reward_status === 'rewarded').reduce((sum, s)=>sum + (s.reward_amount || 0), 0);
        const name = [
          cbUserRec.telegram_first_name,
          cbUserRec.telegram_last_name
        ].filter(Boolean).join(' ') || cbUserRec.full_name || cbUserRec.email;
        await send(cbChatId, `${t(cbLang, 'myaccount.title')}\n\n` + `Name: <b>${name}</b>\n` + `Username: ${cbUserRec.telegram_username ? `@${cbUserRec.telegram_username}` : 'N/A'}\n` + `ID: <code>${cbUserRec.telegram_id || cbUserRec.id}</code>\n\n` + `📊 <b>Statistics</b>\n` + `🛒 Purchased: ${accounts.length} account(s)\n` + `📱 Sold: ${sessions.length} account(s)\n` + `🔐 Total Login: ${sessions.length}\n` + `🎁 Total Reward: $${totalReward.toFixed(2)}\n` + `💰 Total Top Up: $${totalDeposits.toFixed(2)}\n` + `💸 Total Withdraw: $${totalWithdrawals.toFixed(2)}\n` + `💎 Balance: <b>$${bal.toFixed(2)}</b>` + await buildUserRewards(base44, cbUserRec.email));
        break;
      }
    case 'menu_reward':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const { text: rewText, keyboard: rewKb } = await buildRewardsPage(base44, cbLang, 1);
        await sendMenu(cbChatId, rewText, rewKb);
        break;
      }
    case 'menu_withdraw':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const bal = await getRealBalance(base44, cbUserRec.email);
        const v = withdrawAmountView(bal);
        await tgEditMenu(token, cbChatId, cbMsgId, v.text, v.keyboard);
        break;
      }
    case 'menu_channel':
    case 'menu_support':
      {
        const kind = cbData === 'menu_channel' ? 'channel' : 'support';
        const rec = await getState(base44, kind === 'channel' ? 'setting:channel_url' : 'setting:support_url');
        const url = rec ? rec.value : null;
        if (!url) {
          await send(cbChatId, t(cbLang, `${kind}.notConfig`));
          break;
        }
        await sendMenu(cbChatId, `${t(cbLang, `${kind}.title`)}\n\n${t(cbLang, `${kind}.desc`)}`, [
          [
            {
              text: t(cbLang, `${kind}.btn`),
              url
            }
          ]
        ]);
        break;
      }
    case 'menu_language':
      {
        const keyboard = [];
        for(let i = 0; i < BOT_LANGS.length; i += 2){
          keyboard.push(BOT_LANGS.slice(i, i + 2).map((l)=>({
              text: `${l.flag} ${l.label}`,
              callback_data: `langset:${l.code}`
            })));
        }
        await sendMenu(cbChatId, `${t(cbLang, 'lang.selectTitle')}\n\n${t(cbLang, 'lang.selectPrompt')}`, keyboard);
        break;
      }
    case 'menu_refer':
      {
        if (!cbUserRec) {
          await send(cbChatId, t(cbLang, 'bind.required'));
          break;
        }
        const refLink = `https://t.me/tgtopsbot?startapp=${cbUserRec.telegram_id || cbUser.id}`;
        await sendMenu(cbChatId, `${t(cbLang, 'refer.title')}\n\n${t(cbLang, 'refer.desc')}\n\n${t(cbLang, 'refer.yourLink')}:\n<code>${refLink}</code>`, [
          [
            {
              text: t(cbLang, 'refer.copyBtn'),
              copy_text: {
                text: refLink
              }
            },
            {
              text: '📤 Share',
              switch_inline_query: refLink
            }
          ]
        ]);
        break;
      }
  }
}