// The bot's Top Up — a multi-page professional wizard mirroring the app:
// amount picker ($5…$1000 + custom) → payment method (USDT Crypto / OKPay) →
// network (TRC20 / BEP20) → deposit page with QR code, copyable address and the
// unique identify amount that verifies the top-up automatically on-chain.
// Every screen is localized through t(lang, ...) with English fallback.
import { tgSend, tgSendMenu, tgEditMenu, tgDeleteMessage, tgSendPhoto } from '../_shared/telegramApi.ts';
import { t } from '../_shared/botTranslations.js';
import { errText } from './delivery.ts';
import { setState } from './state.ts';

const SEP = '━━━━━━━━━━━━━━━━━━';
const SEC = (title)=>`┈┈┈┈ ${title} ┈┈┈┈`;
const money = (n)=>`$${Number(n || 0).toFixed(2)}`;
const QUICK_AMOUNTS = [
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  1000
];
const NETWORKS = [
  {
    id: 'TRC20',
    name: 'Tron',
    badge: 'USDT TRC20',
    desc: 'Low fees · fast confirmation'
  },
  {
    id: 'BEP20',
    name: 'BNB Chain',
    badge: 'USDT BEP20',
    desc: 'Low fees · fast confirmation'
  },
  {
    id: 'TON',
    name: 'TON Network',
    badge: '',
    desc: 'USDT on The Open Network'
  }
];
const netName = (id)=>NETWORKS.find((n)=>n.id === id) || {
    name: id,
    badge: id,
    desc: ''
  };
// Page 1 — quick amount grid + custom amount.
export function topupAmountView(lang) {
  const L = lang || 'en';
  const kb = [];
  for(let i = 0; i < QUICK_AMOUNTS.length; i += 2){
    kb.push(QUICK_AMOUNTS.slice(i, i + 2).map((a)=>({
        text: `💵 ${money(a)}`,
        callback_data: `tp_amt:${a}`
      })));
  }
  kb.push([
    {
      text: t(L, 'tu.customAmount'),
      callback_data: 'tp_custom'
    }
  ]);
  kb.push([
    {
      text: t(L, 'c.back'),
      callback_data: 'menu_main'
    }
  ]);
  return {
    text: `${SEP}\n${t(L, 'tu.title')}\n${SEP}\n\n${SEC(t(L, 'tu.amountSec'))}\n${t(L, 'tu.amountPrompt')}`,
    keyboard: kb
  };
}
// Page 2 — payment method.
export function topupMethodView(amount, lang) {
  const L = lang || 'en';
  return {
    text: `${SEP}\n${t(L, 'tu.methodTitle', { amount: money(amount) })}\n${SEP}\n\n${SEC(t(L, 'tu.methodSec'))}`,
    keyboard: [
      [
        {
          text: t(L, 'tu.usdtBtn'),
          callback_data: `tp_usdt:${amount}`
        }
      ],
      [
        {
          text: t(L, 'tu.okpayBtn'),
          callback_data: `tp_okpay:${amount}`
        }
      ],
      [
        {
          text: t(L, 'c.back'),
          callback_data: 'menu_topup'
        }
      ]
    ]
  };
}
// Page 3 — network selection for USDT Crypto.
function topupNetworkView(amount, lang) {
  const L = lang || 'en';
  const kb = NETWORKS.map((n)=>[
      {
        text: `🌐 ${n.badge ? `${n.name} — ${n.badge}` : n.name}`,
        callback_data: `tp_net:${amount}:${n.id}`
      }
    ]);
  kb.push([
    {
      text: t(L, 'c.back'),
      callback_data: `tp_usdt:${amount}`
    }
  ]);
  return {
    text: `${SEP}\n${t(L, 'tu.networkTitle', { amount: money(amount) })}\n${SEP}\n\n${SEC(t(L, 'tu.networkSec'))}\n${t(L, 'tu.networkPrompt')}`,
    keyboard: kb
  };
}
// Page 4 — deposit page: QR code photo, then address + identify amount.
async function showDepositPage(base44, token, user, chatId, msgId, amount, networkId, lang) {
  const L = lang || 'en';
  try {
    await tgDeleteMessage(token, chatId, msgId);
  } catch  {}
  const res = await base44.asServiceRole.functions.invoke('topUpRequest', {
    action: 'create',
    amount: Number(amount),
    network: networkId,
    user_email: user.email
  });
  const data = res.data || res;
  if (data.error) throw new Error(data.error);
  const req = data.request || {};
  // QR code for the deposit address — scanned by any wallet app.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(req.wallet_address || '')}`;
  await tgSendPhoto(token, chatId, qrUrl);
  // Compact receipt — exactly the reference layout: header, amount, address,
  // one instruction line, and a single "I Have Paid" button.
  const isTon = networkId === 'TON';
  const title = isTon ? t(L, 'tu.rechargeTon') : networkId === 'BEP20' ? t(L, 'tu.rechargeBnb') : t(L, 'tu.rechargeTrc');
  const amountText = isTon ? `$${Number(req.identify_amount || 0).toFixed(2)} USDT` : `$${Number(req.identify_amount || 0).toFixed(4)} USDT`;
  const text = `💰 <b>${title}</b>\n${SEP}\n` + `${t(L, 'tu.amount', { amount: amountText })}\n` + `${t(L, 'tu.exact')}\n` + `${t(L, 'tu.reserved')}\n${SEP}\n` + `${t(L, 'tu.wallet')}\n${req.wallet_address}\n` + `${t(L, 'tu.tapCopy')}\n${SEP}\n` + `${t(L, 'tu.afterSend')}`;
  await tgSendMenu(token, chatId, text, [
    [
      {
        text: t(L, 'tu.iPaid'),
        callback_data: `tp_chk:${req.request_id}`
      }
    ]
  ]);
}
// OKPay path — instant order, premium receipt.
async function showOkpayPage(base44, token, user, chatId, msgId, amount, lang) {
  const L = lang || 'en';
  try {
    await tgDeleteMessage(token, chatId, msgId);
  } catch  {}
  try {
    const res = await base44.asServiceRole.functions.invoke('createOkpayOrder', {
      amount: Number(amount),
      coin: 'USDT',
      user_email: user.email
    });
    const data = res.data || res;
    if (data.error) throw new Error(data.error);
    const payUrl = data.pay_url || data.payment_url || data.url;
    const text = `${SEP}\n${t(L, 'tu.okpayCreated')}\n${SEP}\n\n${t(L, 'tu.amount', { amount: money(amount) })}\n${t(L, 'tu.okpayPending')}\n${SEP}\n\n${t(L, 'tu.okpayPay')}`;
    const kb = [
      [
        {
          text: t(L, 'tu.okpayBtn'),
          url: payUrl
        }
      ],
      [
        {
          text: t(L, 'c.mainMenu'),
          callback_data: 'menu_main'
        }
      ]
    ];
    await tgSendMenu(token, chatId, text, kb);
  } catch (err) {
    await tgSend(token, chatId, `❌ ${errText(err)}`);
  }
}
// Check Status button — reports the on-chain verification result.
async function checkDepositStatus(base44, token, user, chatId, msgId, requestId, lang) {
  const L = lang || 'en';
  try {
    const res = await base44.asServiceRole.functions.invoke('topUpRequest', {
      action: 'check',
      request_id: requestId,
      user_email: user.email
    });
    const data = res.data || res;
    if (data.error) throw new Error(data.error);
    if (data.status === 'approved') {
      await tgEditMenu(token, chatId, msgId, `${SEP}\n${t(L, 'tu.confirmed')}\n${SEP}\n\n${t(L, 'tu.confirmedBody')}`, [
        [
          {
            text: t(L, 'c.mainMenu'),
            callback_data: 'menu_main'
          }
        ]
      ]);
      return;
    }
    if (data.status === 'rejected') {
      await tgEditMenu(token, chatId, msgId, `${SEP}\n${t(L, 'tu.expired')}\n${SEP}\n\n${t(L, 'tu.expiredBody')}`, [
        [
          {
            text: t(L, 'tu.topupAgain'),
            callback_data: 'menu_topup'
        }
      ]
    ]);
      return;
    }
    await tgSend(token, chatId, t(L, 'tu.pending'));
  } catch (err) {
    await tgSend(token, chatId, `❌ ${errText(err)}`);
  }
}
// Routes every tp_* inline-button press of the Top Up flow.
export async function handleTopupCallback(base44, token, cq, user, lang, chatId, msgId) {
  const cbData = cq.data || '';
  const L = lang || 'en';
  if (!user) {
    await tgSend(token, chatId, t(L, 'bind.required'));
    return;
  }
  const tid = String(cq.from.id);
  if (cbData.startsWith('tp_amt:')) {
    const v = topupMethodView(Number(cbData.slice(7)), L);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData === 'tp_custom') {
    await setState(base44, `topup:${tid}`, JSON.stringify({
      amount: null,
      status: 'awaiting_amount',
      msgs: []
    }));
    await tgEditMenu(token, chatId, msgId, `${SEP}\n${t(L, 'tu.customTitle')}\n${SEP}\n\n${t(L, 'tu.customPrompt')}`, []);
    return;
  }
  if (cbData.startsWith('tp_usdt:')) {
    const v = topupNetworkView(Number(cbData.slice(8)), L);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('tp_net:')) {
    const [, amountRaw, networkId] = cbData.split(':');
    try {
      await showDepositPage(base44, token, user, chatId, msgId, Number(amountRaw), networkId, L);
    } catch (err) {
      await tgSend(token, chatId, `❌ ${errText(err)}`);
    }
    return;
  }
  if (cbData.startsWith('tp_okpay:')) {
    await showOkpayPage(base44, token, user, chatId, msgId, Number(cbData.slice(9)), L);
    return;
  }
  if (cbData.startsWith('tp_chk:')) {
    await checkDepositStatus(base44, token, user, chatId, msgId, cbData.slice(7), L);
    return;
  }
}