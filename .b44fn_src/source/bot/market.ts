import { tgSend, tgSendMenu, tgEditMenu, tgDeleteMessage } from '../_shared/telegramApi.ts';
import { t } from '../_shared/botTranslations.js';
import { getRealBalance } from '../_shared/balance.ts';
import { buySeasonInChunks } from '../_shared/seasonBuy.js';
import { deliverSeasonZip, errText } from './delivery.ts';
import { setState, clearState } from './state.ts';
import { isValidAgeCategory } from '../_shared/accountAge.js';
import { ageCopy, ageName } from '../_shared/botAgeLabels.js';
// The bot's Market — a direct mirror of the app's Market page: the seller
// directory (each seller opens a Spam / Non-Spam stock choice, then their
// country stock), products and the same purchase options (Buy 1, or Buy
// Session Formats with quick and custom quantities — every purchase + 5%
// service fee, confirmed first). Every screen is localized through
// t(lang, ...) with English fallback.
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
// Stock pools: a seller's accounts are filed as Spam or Non-Spam at login
// (SpamBot verdict), and buyers browse one pool at a time.
const poolOf = (raw)=>raw === 'spam' ? 'spam' : 'nonspam';
const poolStock = (c, pool)=>pool === 'spam' ? Number(c.spam_stock || 0) : Number(c.nonspam_stock || 0);
const poolTitle = (L, pool)=>t(L, pool === 'spam' ? 'mk.spamTitle' : 'mk.nonSpamTitle');
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
const findCountry = (seller, iso, age, pool) => {
  const country = seller?.countries.find((item) => item.country_iso === iso);
  const bucket = country?.ages.find((item) => item.category === age);
  if (!bucket) return null;
  const price = pool === 'spam' ? bucket.spam_price : bucket.nonspam_price;
  return { ...country, spam_stock: bucket.spam_stock, nonspam_stock: bucket.nonspam_stock,
    stock: Number(bucket.spam_stock) + Number(bucket.nonspam_stock), price: Number(price || 0), age_category: age };
};
const gone = (lang, sellerEmail)=>[
  [
    {
      text: t(lang, 'c.back'),
      callback_data: sellerEmail ? `mk_s:${sellerEmail}` : 'menu_buy'
    }
  ]
];
// Market menu — the same content the app's Market page shows.
export async function marketMenu(base44, user, lang) {
  const L = lang || 'en';
  const market = await fetchMarket(base44, user);
  let text = `${SEP}\n${t(L, 'mk.menuTitle')}\n${SEP}\n\n${SEC(t(L, 'mk.sellersSec'))}\n${t(L, 'mk.sellersPrompt')}`;
  const kb = [
    [
      {
        text: t(L, 'mk.searchSeller'),
        callback_data: 'mk_search'
      }
    ]
  ];
  for (const s of (market.sellers || []).slice(0, 30)){
    kb.push([
      {
        text: t(L, 'mk.sellerBtn', {
          name: s.name,
          you: s.is_self ? t(L, 'c.you') : '',
          sold: s.sold
        }),
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
      text: t(L, 'c.back'),
      callback_data: 'menu_main'
    }
  ]);
  return {
    text,
    keyboard: kb
  };
}
// One seller — the seller header plus the Spam / Non-Spam stock choice.
async function sellerView(base44, user, sellerEmail, lang) {
  const L = lang || 'en';
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  if (!seller) return {
    text: t(L, 'mk.sellerNotFound'),
    keyboard: gone(L, null)
  };
  let text = `${SEP}\n👤 <b>${seller.name}</b>${seller.is_self ? t(L, 'c.you') : ''}\n${SEP}\n\n`;
  if (seller.username) text += `🔗 @${seller.username}\n`;
  text += `${t(L, 'mk.soldLine', { sold: seller.sold })}\n\n${SEC(t(L, 'mk.stockSec'))}\n${t(L, 'mk.poolPrompt')}`;
  const kb = [
    [
      {
        text: t(L, 'mk.poolNonSpam'),
        callback_data: `mk_pool:${sellerEmail}:nonspam`
      }
    ],
    [
      {
        text: t(L, 'mk.poolSpam'),
        callback_data: `mk_pool:${sellerEmail}:spam`
      }
    ],
    [
      {
        text: t(L, 'c.back'),
        callback_data: 'menu_buy'
      }
    ]
  ];
  return {
    text,
    keyboard: kb
  };
}
// One seller's country stock within a pool (Spam or Non-Spam).
async function poolView(base44, user, sellerEmail, pool, lang) {
  const L = lang || 'en';
  const P = poolOf(pool);
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  if (!seller) return {
    text: t(L, 'mk.sellerNotFound'),
    keyboard: gone(L, null)
  };
  const rows = (seller.countries || []).flatMap((country) => (country.ages || [])
    .map((age) => findCountry(seller, country.country_iso, age.category, P))
    .filter((entry) => entry && poolStock(entry, P) > 0));
  let text = `${SEP}\n👤 <b>${seller.name}</b>${seller.is_self ? t(L, 'c.you') : ''}\n${SEP}\n\n${poolTitle(L, P)}\n\n${SEC(t(L, 'mk.stockSec'))}\n${t(L, 'mk.tapCountry')}`;
  if (!rows.length) text += `\n\n${t(L, 'mk.sellerNotFound')}`;
  const kb = [];
  for (const c of rows){
    kb.push([
      {
        text: `${c.flag || '🌐'} ${c.country_name}${dial(c.dial_code)} · ${ageName(c.age_category, L)} — ${money(c.price)} (${poolStock(c, P)})`,
        callback_data: `mk_c:${sellerEmail}:${c.country_iso}:${P}:${c.age_category}`
      }
    ]);
  }
  kb.push([
    {
      text: t(L, 'c.back'),
      callback_data: `mk_s:${sellerEmail}`
    }
  ]);
  return {
    text,
    keyboard: kb
  };
}
// Purchase page for one seller's country and pool — mirrors the app's buy page.
async function buyView(base44, user, sellerEmail, iso, pool, lang, age) {
  const L = lang || 'en';
  const P = poolOf(pool);
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  const country = findCountry(seller, iso, age, P);
  if (!country) return {
    text: t(L, 'mk.countryNotFound'),
    keyboard: gone(L, sellerEmail)
  };
  const stock = poolStock(country, P);
  const bal = await getRealBalance(base44, user.email);
  let text = `${SEP}\n${country.flag || '🌐'} <b>${country.country_name}</b>${dial(country.dial_code)} — ${poolTitle(L, P).replace(/<[^>]+>/g, '')}\n${SEP}\n\n`;
  text += `${ageCopy(L, 0)}: <b>${ageName(age, L)}</b>\n`;
  text += `${t(L, 'mk.seller', { name: seller.name })}\n`;
  text += `${t(L, 'mk.price', { price: money(country.price) })}\n`;
  text += `${t(L, 'mk.totalEach', { total: money(country.price + feeOf(country.price)) })}\n`;
  text += `${t(L, 'mk.stockAvail', { stock })}\n`;
  text += `${t(L, 'mk.balance', { balance: money(bal) })}\n\n${SEC(t(L, 'mk.purchaseSec'))}`;
  if (seller.is_self) {
    text += `\n\n${t(L, 'mk.ownListing')}`;
    return {
      text,
      keyboard: gone(L, sellerEmail)
    };
  }
  return {
    text,
    keyboard: [
      [
        {
          text: t(L, 'buy.buy1'),
          callback_data: `mk_b1:${sellerEmail}:${iso}:${P}:${age}`
        }
      ],
      [
        {
          text: t(L, 'mk.buyFormats'),
          callback_data: `mk_f:${sellerEmail}:${iso}:${P}:${age}`
        }
      ],
      [
        {
          text: t(L, 'c.back'),
          callback_data: `mk_pool:${sellerEmail}:${P}`
        }
      ]
    ]
  };
}
// Session-format quantities — mirrors the app's Buy Session Formats sheet.
async function formatsView(base44, user, sellerEmail, iso, pool, lang, age) {
  const L = lang || 'en';
  const P = poolOf(pool);
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  const country = findCountry(seller, iso, age, P);
  if (!country) return {
    text: t(L, 'mk.countryNotFound'),
    keyboard: gone(L, sellerEmail)
  };
  const kb = [];
  for(let i = 0; i < QUICK_QTY.length; i += 4){
    kb.push(QUICK_QTY.slice(i, i + 4).map((q)=>({
        text: `📦 ${q}`,
        callback_data: `mk_q:${sellerEmail}:${iso}:${q}:${P}:${age}`
      })));
  }
  kb.push([
    {
      text: t(L, 'mk.customQty'),
      callback_data: `mk_x:${sellerEmail}:${iso}:${P}:${age}`
    }
  ]);
  kb.push([
    {
      text: t(L, 'c.back'),
      callback_data: `mk_c:${sellerEmail}:${iso}:${P}:${age}`
    }
  ]);
  return {
    text: `${SEP}\n${t(L, 'mk.formatsTitle')}\n${SEP}\n\n${ageCopy(L, 0)}: ${ageName(age, L)}\n${t(L, 'mk.formatsLine', {
        flag: country.flag || '🌐',
        country: country.country_name,
        total: money(country.price + feeOf(country.price))
      })}\n${t(L, 'mk.stockAvail', { stock: poolStock(country, P) })}\n\n${SEC(t(L, 'mk.chooseQty'))}`,
    keyboard: kb
  };
}
// Confirmation with the same cost breakdown the app shows (price + 5% fee).
export async function showMarketConfirm(base44, token, user, chatId, sellerEmail, iso, qty, opts = {
  }) {
  const lang = opts.lang || 'en';
  const L = lang;
  const P = poolOf(opts.pool);
  const age = opts.age;
  const reply = async (text, kb)=>{
    if (opts.editMsgId) await tgEditMenu(token, chatId, opts.editMsgId, text, kb);
    else await tgSendMenu(token, chatId, text, kb, opts.replyTo);
  };
  const market = await fetchMarket(base44, user);
  const seller = findSeller(market, sellerEmail);
  const country = findCountry(seller, iso, age, P);
  if (!country) {
    await reply(t(L, 'mk.countryNotFound'), gone(L, sellerEmail));
    return;
  }
  const stock = poolStock(country, P);
  if (!Number.isInteger(qty) || qty < 1 || qty > 3000) {
    await reply(t(L, 'mk.qtyRange'), gone(L, sellerEmail));
    return;
  }
  if (stock < qty) {
    await reply(t(L, 'mk.onlyStock', {
      stock,
      country: country.country_name
    }), [
      [
        {
          text: t(L, 'c.back'),
          callback_data: `mk_c:${sellerEmail}:${iso}:${P}:${age}`
        }
      ]
    ]);
    return;
  }
  const subtotal = Number((country.price * qty).toFixed(2));
  const fee = feeOf(subtotal);
  const total = Number((subtotal + fee).toFixed(2));
  const bal = await getRealBalance(base44, user.email);
  if (bal < total) {
    await reply(t(L, 'mk.insufficient', {
      total: money(total),
      balance: money(bal)
    }), [
      [
        {
          text: t(L, 'menu.topup'),
          callback_data: 'menu_topup'
        }
      ],
      [
        {
          text: t(L, 'c.back'),
          callback_data: `mk_c:${sellerEmail}:${iso}:${P}:${age}`
        }
      ]
    ]);
    return;
  }
  await reply(`${SEP}\n${t(L, 'mk.confirmTitle')}\n${SEP}\n\n👤 ${seller.name}\n${country.flag || '🌐'} <b>${country.country_name}</b> (${iso}) — ${poolTitle(L, P)}\n${ageCopy(L, 0)}: ${ageName(age, L)}\n\n` + `${t(L, 'mk.confirmQty', { qty })}\n` + `${t(L, 'mk.confirmSub', {
      qty,
      price: money(country.price),
      subtotal: money(subtotal)
    })}\n` + `${t(L, 'mk.confirmFee', { fee: money(fee) })}\n` + `${SEP}\n` + `${t(L, 'mk.confirmTotal', { total: money(total) })}\n` + `${t(L, 'mk.balance', { balance: money(bal) })}\n${SEP}\n\n` + `${t(L, 'mk.deliveryNote')}`, [
    [
      {
        text: t(L, 'c.confirm'),
        callback_data: `mk_ok:${sellerEmail}:${iso}:${qty}:${P}:${age}`
      }
    ],
    [
      {
        text: t(L, 'c.cancel'),
        callback_data: `mk_c:${sellerEmail}:${iso}:${P}:${age}`
      }
    ]
  ]);
}
// Buy 1 — claims one account and returns the phone number.
async function buyOne(base44, token, user, chatId, msgId, sellerEmail, iso, pool, lang, age) {
  const L = lang || 'en';
  const P = poolOf(pool);
  try {
    await tgDeleteMessage(token, chatId, msgId).catch(()=>{});
  } catch  {}
  try {
    const market = await fetchMarket(base44, user);
    const country = findCountry(findSeller(market, sellerEmail), iso, age, P);
    const res = await base44.asServiceRole.functions.invoke('purchaseAccount', {
      user_email: user.email,
      country_iso: iso,
      quantity: 1,
      owner_email: sellerEmail,
      spam_pool: P,
      age_category: age
    });
    const data = res.data || res;
    if (data.error) throw new Error(data.error);
    let msg = `${SEP}\n${t(L, 'mk.purchaseComplete')}\n${SEP}\n\n`;
    if (country) msg += `${country.flag || '🌐'} <b>${country.country_name}</b> (${iso})\n`;
    msg += `${t(L, 'mk.amount', { amount: money(country ? country.price + feeOf(country.price) : 0) })}\n`;
    msg += `${t(L, 'mk.phone', { phone: data.phone || '' })}\n`;
    msg += `${t(L, 'mk.twofaRemoved')}\n`;
    msg += `${t(L, 'mk.newBalance', { balance: money(data.balance) })}\n`;
    await tgSendMenu(token, chatId, msg, [
      [
        {
          text: t(L, 'buy.otpBtn'),
          callback_data: `getotp:${data.first_account_id}`
        }
      ],
      [
        {
          text: t(L, 'buy.buyAgain'),
          callback_data: `mk_b1:${sellerEmail}:${iso}:${P}:${age}`
        }
      ]
    ]);
  } catch (err) {
    await tgSend(token, chatId, `❌ ${errText(err)}`);
  }
}
// Batch purchase — session formats delivered to this chat.
async function buyBatch(base44, token, user, chatId, msgId, sellerEmail, iso, qty, pool, lang, age) {
  const L = lang || 'en';
  const P = poolOf(pool);
  try {
    await tgDeleteMessage(token, chatId, msgId);
  } catch  {}
  try {
    const { ids, error } = await buySeasonInChunks(base44, {
      country_iso: iso,
      user_email: user.email,
      quantity: qty,
      owner_email: sellerEmail,
      spam_pool: P,
      age_category: age,
      onChunk: qty > 100 ? async ({ done, total })=>{
        await tgSend(token, chatId, t(L, 'mk.ready', { done, total }));
      } : null
    });
    if (!ids.length) throw new Error(error || t(L, 'mk.noAccounts'));
    const market = await fetchMarket(base44, user);
    const seller = findSeller(market, sellerEmail);
    const country = findCountry(seller, iso, age, P);
    let msg = `${SEP}\n${t(L, 'mk.purchaseComplete')}\n${SEP}\n\n`;
    if (country) msg += `${country.flag || '🌐'} <b>${country.country_name}</b> (${iso}) — ${seller ? seller.name : ''}\n`;
    msg += `${t(L, 'mk.accounts', { got: ids.length, qty })}\n`;
    msg += `${t(L, 'mk.amount', { amount: money(ids.length * (country ? country.price + feeOf(country.price) : 0)) })}\n`;
    if (ids.length < qty) msg += `${t(L, 'mk.notDelivered', { count: qty - ids.length })}\n`;
    await tgSendMenu(token, chatId, msg, [
      [
        {
          text: t(L, 'buy.buyAgain'),
          callback_data: `mk_ok:${sellerEmail}:${iso}:${qty}:${P}:${age}`
        }
      ]
    ]);
    await deliverSeasonZip(base44, token, chatId, ids, null, lang);
  } catch (err) {
    await tgSend(token, chatId, `❌ ${errText(err)}`);
  }
}
// Routes every mk_* inline-button press of the Market flow.
export async function handleMarketCallback(base44, token, cq, user, lang, chatId, msgId) {
  const cbData = cq.data || '';
  const L = lang || 'en';
  if (!user) {
    await tgSend(token, chatId, t(L, 'bind.required'));
    return;
  }
  const tid = String(cq.from.id);
  const age = cbData.split(':').at(-1);
  if (/^mk_(c|f|q|x|b1|ok):/.test(cbData) && !isValidAgeCategory(age)) {
    const parts = cbData.split(':');
    const pool = ['mk_q', 'mk_ok'].includes(parts[0]) ? parts[4] : parts[3];
    const view = await poolView(base44, user, parts[1], pool, L);
    await tgEditMenu(token, chatId, msgId, view.text, view.keyboard);
    return;
  }
  // Any other Market button cancels a pending seller search.
  if (cbData !== 'mk_search') await clearState(base44, `mksearch:${tid}`).catch(()=>{});
  if (cbData === 'mk_search') {
    await setState(base44, `mksearch:${tid}`, JSON.stringify({
      status: 'awaiting_query'
    }));
    await tgEditMenu(token, chatId, msgId, `${SEP}\n🔍 <b>${t(L, 'mk.searchSeller').replace('🔍 ', '')}</b>\n${SEP}\n\n${t(L, 'mk.searchPrompt')}`, [
      [
        {
          text: t(L, 'c.back'),
          callback_data: 'menu_buy'
        }
      ]
    ]);
    return;
  }
  if (cbData.startsWith('mk_s:')) {
    const v = await sellerView(base44, user, cbData.slice(5), L);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('mk_pool:')) {
    const [, sellerEmail, poolRaw] = cbData.split(':');
    const v = await poolView(base44, user, sellerEmail, poolRaw, L);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('mk_c:')) {
    const [, sellerEmail, iso, poolRaw] = cbData.split(':');
    const v = await buyView(base44, user, sellerEmail, iso, poolRaw, L, age);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('mk_f:')) {
    const [, sellerEmail, iso, poolRaw] = cbData.split(':');
    const v = await formatsView(base44, user, sellerEmail, iso, poolRaw, L, age);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('mk_q:')) {
    const [, sellerEmail, iso, qtyRaw, poolRaw] = cbData.split(':');
    await showMarketConfirm(base44, token, user, chatId, sellerEmail, iso, parseInt(qtyRaw), {
      editMsgId: msgId,
      lang: L,
      pool: poolRaw,
      age
    });
    return;
  }
  if (cbData.startsWith('mk_x:')) {
    const [, sellerEmail, iso, poolRaw] = cbData.split(':');
    const P = poolOf(poolRaw);
    const market = await fetchMarket(base44, user);
    const country = findCountry(findSeller(market, sellerEmail), iso, age, P);
    if (!country) {
      await tgEditMenu(token, chatId, msgId, t(L, 'mk.countryNotFound'), gone(L, sellerEmail));
      return;
    }
    await setState(base44, `mkqty:${tid}`, JSON.stringify({
      seller_email: sellerEmail,
      iso,
      pool: P,
      age,
      status: 'awaiting_qty'
    }));
    await tgSend(token, chatId, t(L, 'mk.qtyPrompt', { max: poolStock(country, P) }));
    return;
  }
  if (cbData.startsWith('mk_b1:')) {
    const [, sellerEmail, iso, poolRaw] = cbData.split(':');
    await buyOne(base44, token, user, chatId, msgId, sellerEmail, iso, poolRaw, L, age);
    return;
  }
  if (cbData.startsWith('mk_ok:')) {
    const [, sellerEmail, iso, qtyRaw, poolRaw] = cbData.split(':');
    await buyBatch(base44, token, user, chatId, msgId, sellerEmail, iso, parseInt(qtyRaw) || 1, poolRaw, L, age);
    return;
  }
  if (cbData.startsWith('mk_p:')) {
    const productId = cbData.slice(5);
    const market = await fetchMarket(base44, user);
    const product = (market.products || []).find((p)=>p.id === productId);
    if (!product) {
      await tgEditMenu(token, chatId, msgId, t(L, 'mk.productNotFound'), gone(L, null));
      return;
    }
    const bal = await getRealBalance(base44, user.email);
    await tgEditMenu(token, chatId, msgId, `🛒 <b>${product.name}</b>\n💰 ${money(product.price)}\n${t(L, 'mk.balance', { balance: money(bal) })}\n\n${t(L, 'mk.buyProduct')}`, [
      [
        {
          text: t(L, 'c.confirm'),
          callback_data: `mk_pc:${productId}`
        }
      ],
      [
        {
          text: t(L, 'c.back'),
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
      await tgSend(token, chatId, `${t(L, 'mk.purchaseComplete')}\n\n🛒 ${data.product_name || ''}\n${t(L, 'mk.amount', { amount: money(data.price) })}\n${t(L, 'mk.newBalance', { balance: money(data.balance) })}`);
    } catch (err) {
      await tgSend(token, chatId, `❌ ${errText(err)}`);
    }
    return;
  }
}

// A seller search the user typed after tapping 🔍 Search Seller.
export async function handleMarketSearchFlow(base44, token, ctx) {
  const { chatId, replyTo, rawText, user } = ctx;
  const L = ctx.lang || 'en';
  const tid = String(ctx.tgUser.id);
  await clearState(base44, `mksearch:${tid}`);
  if (!user) {
    await tgSend(token, chatId, t(L, 'bind.required'), replyTo);
    return true;
  }
  const query = String(rawText || '').trim().replace(/^@+/, '');
  if (!query) {
    await tgSend(token, chatId, t(L, 'mk.searchPrompt'), replyTo);
    return true;
  }
  const market = await fetchMarket(base44, user, query);
  const sellers = market.sellers || [];
  if (!sellers.length) {
    await tgSendMenu(token, chatId, `${SEP}\n${t(L, 'mk.searchTitle', { query })}\n${SEP}\n\n${t(L, 'mk.noSellers')}`, [
      [
        {
          text: t(L, 'mk.newSearch'),
          callback_data: 'mk_search'
        }
      ],
      [
        {
          text: t(L, 'mk.backToMarket'),
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
        text: t(L, 'mk.sellerBtn', {
          name: s.name,
          you: s.is_self ? t(L, 'c.you') : '',
          sold: s.sold
        }),
        callback_data: `mk_s:${s.email}`
      }
    ]);
  }
  kb.push([
    {
      text: t(L, 'mk.newSearch'),
      callback_data: 'mk_search'
    }
  ]);
  kb.push([
    {
      text: t(L, 'mk.backToMarket'),
      callback_data: 'menu_buy'
    }
  ]);
  await tgSendMenu(token, chatId, `${SEP}\n${t(L, 'mk.searchTitle', { query })}\n${SEP}\n\n${t(L, 'mk.sellersFound', { count: sellers.length })}`, kb, replyTo);
  return true;
}