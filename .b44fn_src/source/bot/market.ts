import { tgSend, tgSendMenu, tgEditMenu, tgDeleteMessage } from '../_shared/telegramApi.ts';
import { t } from '../_shared/botTranslations.js';
import { getRealBalance } from '../_shared/balance.ts';
import { buySeasonInChunks } from '../_shared/seasonBuy.js';
import { deliverSeasonZip, errText } from './delivery.ts';
import { setState, clearState } from './state.ts';
// The bot's Market — a direct mirror of the app's Market page: the seller
// directory (each seller opens their country stock), products and
// the same purchase options (Buy 1, or Buy Session Formats with quick and
// custom quantities — every purchase + 5% service fee, confirmed first).
const QUICK_QTY = [
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  1000
];
const SEP = '━━━━━━━━━━━━━━━━━━';
const SEC = (title)=>`┈┈┈┈ ${title} ┈┈┈┈`;
const feeOf = (amount)=>Math.round(amount * 5) / 100;
const money = (n)=>`$${Number(n || 0).toFixed(2)}`;
const dial = (code)=>code ? ` +${String(code).replace(/^\+/, '')}` : '';
async function fetchMarket(base44, user, query) {
  const res = await base44.asServiceRole.functions.invoke('getMarketSellers', {
    user_email: user.email,
    query
  });
  const data = res.data || res;
  if (data.error) throw new Error(data.error);
  return data;
}
const findSeller = (market, email)=>(market.sellers || []).find((s)=>s.email === email);
const findCountry = (seller, iso)=>seller && (seller.countries || []).find((c)=>c.country_iso === iso);
const gone = (sellerEmail)=>[
  [
    {
      text: '⬅️ Back',
      callback_data: sellerEmail ? `mk_s:${sellerEmail}` : 'menu_buy'
    }
  ]
];
// Market menu — the same content the app's Market page shows.
export async function marketMenu(base44, user) {
  const market = await fetchMarket(base44, user);
  let text = `${SEP}\n🌍 <b>Market</b>\n${SEP}\n\n${SEC('👤 <b>Sellers</b>')}\nTap a seller to browse their stock:`;
  const kb = [
    [
      {
        text: '🔍 Search Seller',
        callback_data: 'mk_search'
      }
    ]
  ];
  for (const s of (market.sellers || []).slice(0, 30)){
    kb.push([
      {
        text: `👤 ${s.name}${s.is_self ? ' (You)' : ''} · ${s.sold} sold`,
        callback_data: `mk_s:${s.email}`
      }
    ]);
  }
  for (const p of market.products || []){
    kb.push([
      {
        text: `🛒 ${p.name} ${money(p.price)}`,
        callback_data: `mk_p:${p.id}`
      }
    ]);
  }
  kb.push([
    {
      text: '⬅️ Back',
      callback_data: 'menu_main'
    }
  ]);
  return {
    text,
    keyboard: kb
  };
}
// One seller's country stock — mirrors the app's seller page.
async function sellerView(base44, user, sellerEmail) {
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  if (!seller) return {
    text: '❌ Seller not found — they may be out of stock.',
    keyboard: gone(null)
  };
  let text = `${SEP}\n👤 <b>${seller.name}</b>${seller.is_self ? ' (You)' : ''}\n${SEP}\n\n`;
  if (seller.username) text += `🔗 @${seller.username}\n`;
  text += `🏆 ${seller.sold} sold\n\n${SEC('📦 <b>Stock</b>')}\nTap a country to buy:`;
  const kb = [];
  for (const c of seller.countries || []){
    kb.push([
      {
        text: `${c.flag || '🌐'} ${c.country_name}${dial(c.dial_code)} — ${money(c.price)} (${c.stock})`,
        callback_data: `mk_c:${sellerEmail}:${c.country_iso}`
      }
    ]);
  }
  kb.push([
    {
      text: '⬅️ Back',
      callback_data: 'menu_buy'
    }
  ]);
  return {
    text,
    keyboard: kb
  };
}
// Purchase page for one seller's country — mirrors the app's buy page.
async function buyView(base44, user, sellerEmail, iso) {
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  const country = findCountry(seller, iso);
  if (!country) return {
    text: '❌ Country not found — the stock may have just sold out.',
    keyboard: gone(sellerEmail)
  };
  const bal = await getRealBalance(base44, user.email);
  let text = `${SEP}\n${country.flag || '🌐'} <b>${country.country_name}</b>${dial(country.dial_code)}\n${SEP}\n\n`;
  text += `👤 Seller: <b>${seller.name}</b>\n`;
  text += `💰 Price: <b>${money(country.price)}</b> + 5% service fee\n`;
  text += `🧾 Total each: <b>${money(country.price + feeOf(country.price))}</b>\n`;
  text += `📦 Stock: <b>${country.stock}</b> available\n`;
  text += `💵 Balance: ${money(bal)}\n\n${SEC('🛒 <b>Purchase</b>')}`;
  if (seller.is_self) {
    text += `\n\nThis is your own listing — you can't buy your own stock.`;
    return {
      text,
      keyboard: gone(sellerEmail)
    };
  }
  return {
    text,
    keyboard: [
      [
        {
          text: '🛒 Buy 1',
          callback_data: `mk_b1:${sellerEmail}:${iso}`
        }
      ],
      [
        {
          text: '📦 Buy Session Formats',
          callback_data: `mk_f:${sellerEmail}:${iso}`
        }
      ],
      [
        {
          text: '⬅️ Back',
          callback_data: `mk_s:${sellerEmail}`
        }
      ]
    ]
  };
}
// Session-format quantities — mirrors the app's Buy Session Formats sheet.
async function formatsView(base44, user, sellerEmail, iso) {
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  const country = findCountry(seller, iso);
  if (!country) return {
    text: '❌ Country not found — the stock may have just sold out.',
    keyboard: gone(sellerEmail)
  };
  const kb = [];
  for(let i = 0; i < QUICK_QTY.length; i += 4){
    kb.push(QUICK_QTY.slice(i, i + 4).map((q)=>({
        text: `📦 ${q}`,
        callback_data: `mk_q:${sellerEmail}:${iso}:${q}`
      })));
  }
  kb.push([
    {
      text: '✍️ Custom quantity',
      callback_data: `mk_x:${sellerEmail}:${iso}`
    }
  ]);
  kb.push([
    {
      text: '⬅️ Back',
      callback_data: `mk_c:${sellerEmail}:${iso}`
    }
  ]);
  return {
    text: `${SEP}\n📦 <b>Buy Session Formats</b>\n${SEP}\n\n${country.flag || '🌐'} <b>${country.country_name}</b> — <b>${money(country.price + feeOf(country.price))}</b> each (incl. 5% fee)\n📦 Stock: <b>${country.stock}</b> available\n\n${SEC('🔢 <b>Choose a quantity</b>')}`,
    keyboard: kb
  };
}
// Confirmation with the same cost breakdown the app shows (price + 5% fee).
export async function showMarketConfirm(base44, token, user, chatId, sellerEmail, iso, qty, opts = {
}) {
  const reply = async (text, kb)=>{
    if (opts.editMsgId) await tgEditMenu(token, chatId, opts.editMsgId, text, kb);
    else await tgSendMenu(token, chatId, text, kb, opts.replyTo);
  };
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  const country = findCountry(seller, iso);
  if (!country) {
    await reply('❌ Country not found — the stock may have just sold out.', gone(sellerEmail));
    return;
  }
  if (!Number.isInteger(qty) || qty < 1 || qty > 3000) {
    await reply('❌ Quantity must be a whole number between 1 and 3000.', gone(sellerEmail));
    return;
  }
  if (country.stock < qty) {
    await reply(`❌ Only ${country.stock} in stock for ${country.country_name}.`, gone(sellerEmail));
    return;
  }
  const subtotal = Number((country.price * qty).toFixed(2));
  const fee = feeOf(subtotal);
  const total = Number((subtotal + fee).toFixed(2));
  const bal = await getRealBalance(base44, user.email);
  if (bal < total) {
    await reply(`❌ Insufficient balance.\n\nTotal: ${money(total)}\nYour balance: ${money(bal)}\n\nTop up your balance and try again.`, [
      [
        {
          text: '💳 Top Up',
          callback_data: 'menu_topup'
        }
      ],
      [
        {
          text: '⬅️ Back',
          callback_data: `mk_c:${sellerEmail}:${iso}`
        }
      ]
    ]);
    return;
  }
  await reply(`${SEP}\n🧾 <b>Confirm Purchase</b>\n${SEP}\n\n👤 ${seller.name}\n${country.flag || '🌐'} <b>${country.country_name}</b> (${iso})\n\n` + `📦 Quantity: <b>${qty}</b>\n` + `💰 ${qty} × ${money(country.price)}: ${money(subtotal)}\n` + `🧾 Service fee (5%): ${money(fee)}\n` + `${SEP}\n` + `💳 <b>Total: ${money(total)}</b>\n` + `💵 Balance: ${money(bal)}\n${SEP}\n\n` + `Session formats will be delivered to this chat, with 2FA removed.`, [
    [
      {
        text: '✅ Confirm',
        callback_data: `mk_ok:${sellerEmail}:${iso}:${qty}`
      }
    ],
    [
      {
        text: '❌ Cancel',
        callback_data: `mk_c:${sellerEmail}:${iso}`
      }
    ]
  ]);
}
// Buy 1 — claims one account and returns the phone number.
async function buyOne(base44, token, user, chatId, msgId, sellerEmail, iso) {
  try {
    await tgDeleteMessage(token, chatId, msgId).catch(()=>{});
  } catch  {}
  try {
    const market = await fetchMarket(base44, user);
    const country = findCountry(findSeller(market, sellerEmail), iso);
    const res = await base44.asServiceRole.functions.invoke('purchaseAccount', {
      user_email: user.email,
      country_iso: iso,
      quantity: 1,
      owner_email: sellerEmail
    });
    const data = res.data || res;
    if (data.error) throw new Error(data.error);
    let msg = `${SEP}\n<b>Purchase Complete</b>\n${SEP}\n\n`;
    if (country) msg += `${country.flag || '🌐'} <b>${country.country_name}</b> (${iso})\n`;
    msg += `💰 Amount: <b>${money(country ? country.price + feeOf(country.price) : 0)}</b> (incl. 5% fee)\n`;
    msg += `📱 Phone: <code>${data.phone || ''}</code>\n`;
    msg += `🛡️ 2FA: <b>Removed</b>\n`;
    msg += `💵 New balance: <b>${money(data.balance)}</b>\n`;
    await tgSendMenu(token, chatId, msg, [
      [
        {
          text: '📱 Get OTP',
          callback_data: `getotp:${data.first_account_id}`
        }
      ],
      [
        {
          text: '🔁 Buy Again',
          callback_data: `mk_b1:${sellerEmail}:${iso}`
        }
      ]
    ]);
  } catch (err) {
    await tgSend(token, chatId, `❌ ${errText(err)}`);
  }
}
// Batch purchase — session formats delivered to this chat.
async function buyBatch(base44, token, user, chatId, msgId, sellerEmail, iso, qty) {
  try {
    await tgDeleteMessage(token, chatId, msgId);
  } catch  {}
  try {
    const { ids, error } = await buySeasonInChunks(base44, {
      country_iso: iso,
      user_email: user.email,
      quantity: qty,
      owner_email: sellerEmail,
      onChunk: qty > 100 ? async ({ done, total })=>{
        await tgSend(token, chatId, `⏳ ${done}/${total} accounts ready…`);
      } : null
    });
    if (!ids.length) throw new Error(error || 'No accounts could be delivered');
    const market = await fetchMarket(base44, user);
    const seller = findSeller(market, sellerEmail);
    const country = findCountry(seller, iso);
    let msg = `${SEP}\n<b>Purchase Complete</b>\n${SEP}\n\n`;
    if (country) msg += `${country.flag || '🌐'} <b>${country.country_name}</b> (${iso}) — ${seller ? seller.name : ''}\n`;
    msg += `📦 Accounts: <b>${ids.length}/${qty}</b>\n`;
    msg += `💰 Amount: <b>${money(ids.length * (country ? country.price + feeOf(country.price) : 0))}</b> (incl. 5% fee)\n`;
    if (ids.length < qty) msg += `⚠️ ${qty - ids.length} could not be delivered (not charged)\n`;
    await tgSendMenu(token, chatId, msg, [
      [
        {
          text: '🔁 Buy Again',
          callback_data: `mk_ok:${sellerEmail}:${iso}:${qty}`
        }
      ]
    ]);
    await deliverSeasonZip(base44, token, chatId, ids);
  } catch (err) {
    await tgSend(token, chatId, `❌ ${errText(err)}`);
  }
}
// Routes every mk_* inline-button press of the Market flow.
export async function handleMarketCallback(base44, token, cq, user, lang, chatId, msgId) {
  const cbData = cq.data || '';
  if (!user) {
    await tgSend(token, chatId, t(lang, 'bind.required'));
    return;
  }
  const tid = String(cq.from.id);
  // Any other Market button cancels a pending seller search.
  if (cbData !== 'mk_search') await clearState(base44, `mksearch:${tid}`).catch(()=>{});
  if (cbData === 'mk_search') {
    await setState(base44, `mksearch:${tid}`, JSON.stringify({
      status: 'awaiting_query'
    }));
    await tgEditMenu(token, chatId, msgId, `${SEP}\n🔍 <b>Search Seller</b>\n${SEP}\n\nSend a username or name to search:`, [
      [
        {
          text: '⬅️ Back',
          callback_data: 'menu_buy'
        }
      ]
    ]);
    return;
  }
  if (cbData.startsWith('mk_s:')) {
    const v = await sellerView(base44, user, cbData.slice(5));
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('mk_c:')) {
    const [, sellerEmail, iso] = cbData.split(':');
    const v = await buyView(base44, user, sellerEmail, iso);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('mk_f:')) {
    const [, sellerEmail, iso] = cbData.split(':');
    const v = await formatsView(base44, user, sellerEmail, iso);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('mk_q:')) {
    const [, sellerEmail, iso, qtyRaw] = cbData.split(':');
    await showMarketConfirm(base44, token, user, chatId, sellerEmail, iso, parseInt(qtyRaw), {
      editMsgId: msgId
    });
    return;
  }
  if (cbData.startsWith('mk_x:')) {
    const [, sellerEmail, iso] = cbData.split(':');
    const market = await fetchMarket(base44, user);
    const country = findCountry(findSeller(market, sellerEmail), iso);
    if (!country) {
      await tgEditMenu(token, chatId, msgId, '❌ Country not found — the stock may have just sold out.', gone(sellerEmail));
      return;
    }
    await setState(base44, `mkqty:${tid}`, JSON.stringify({
      seller_email: sellerEmail,
      iso,
      status: 'awaiting_qty'
    }));
    await tgSend(token, chatId, `✍️ Send a quantity (max ${country.stock}):`);
    return;
  }
  if (cbData.startsWith('mk_b1:')) {
    const [, sellerEmail, iso] = cbData.split(':');
    await buyOne(base44, token, user, chatId, msgId, sellerEmail, iso);
    return;
  }
  if (cbData.startsWith('mk_ok:')) {
    const [, sellerEmail, iso, qtyRaw] = cbData.split(':');
    await buyBatch(base44, token, user, chatId, msgId, sellerEmail, iso, parseInt(qtyRaw) || 1);
    return;
  }
  if (cbData.startsWith('mk_p:')) {
    const productId = cbData.slice(5);
    const market = await fetchMarket(base44, user);
    const product = (market.products || []).find((p)=>p.id === productId);
    if (!product) {
      await tgEditMenu(token, chatId, msgId, '❌ Product not found.', gone(null));
      return;
    }
    const bal = await getRealBalance(base44, user.email);
    await tgEditMenu(token, chatId, msgId, `🛒 <b>${product.name}</b>\n💰 ${money(product.price)}\n💵 Balance: ${money(bal)}\n\nBuy this product?`, [
      [
        {
          text: '✅ Confirm',
          callback_data: `mk_pc:${productId}`
        }
      ],
      [
        {
          text: '⬅️ Back',
          callback_data: 'menu_buy'
        }
      ]
    ]);
    return;
  }
  if (cbData.startsWith('mk_pc:')) {
    const productId = cbData.slice(6);
    try {
      await tgDeleteMessage(token, chatId, msgId);
    } catch  {}
    try {
      const res = await base44.asServiceRole.functions.invoke('purchaseProduct', {
        product_id: productId,
        user_email: user.email
      });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      await tgSend(token, chatId, `<b>Purchase Complete</b>\n\n🛒 ${data.product_name || ''}\n💰 Amount: <b>${money(data.price)}</b>\n💵 New balance: <b>${money(data.balance)}</b>`);
    } catch (err) {
      await tgSend(token, chatId, `❌ ${errText(err)}`);
    }
    return;
  }
}

// A seller search the user typed after tapping 🔍 Search Seller.
export async function handleMarketSearchFlow(base44, token, ctx) {
  const { chatId, replyTo, rawText, user } = ctx;
  const tid = String(ctx.tgUser.id);
  await clearState(base44, `mksearch:${tid}`);
  if (!user) {
    await tgSend(token, chatId, t('en', 'bind.required'), replyTo);
    return true;
  }
  const query = String(rawText || '').trim().replace(/^@+/, '');
  if (!query) {
    await tgSend(token, chatId, `❌ Send a username or name to search:`, replyTo);
    return true;
  }
  const market = await fetchMarket(base44, user, query);
  const sellers = market.sellers || [];
  if (!sellers.length) {
    await tgSendMenu(token, chatId, `${SEP}\n🔍 <b>Search — ${query}</b>\n${SEP}\n\n❌ No sellers found.`, [
      [
        {
          text: '🔍 New Search',
          callback_data: 'mk_search'
        }
      ],
      [
        {
          text: '⬅️ Back to Market',
          callback_data: 'menu_buy'
        }
      ]
    ], replyTo);
    return true;
  }
  const kb = [];
  for (const s of sellers.slice(0, 30)){
    kb.push([
      {
        text: `👤 ${s.name}${s.is_self ? ' (You)' : ''} · ${s.sold} sold`,
        callback_data: `mk_s:${s.email}`
      }
    ]);
  }
  kb.push([
    {
      text: '🔍 New Search',
      callback_data: 'mk_search'
    }
  ]);
  kb.push([
    {
      text: '⬅️ Back to Market',
      callback_data: 'menu_buy'
    }
  ]);
  await tgSendMenu(token, chatId, `${SEP}\n🔍 <b>Search — ${query}</b>\n${SEP}\n\n${sellers.length} seller(s) found. Tap a seller to browse their stock:`, kb, replyTo);
  return true;
}