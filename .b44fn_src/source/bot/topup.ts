// The bot's Top Up — a multi-page professional wizard mirroring the app:
// amount picker ($5…$1000 + custom) → payment method (USDT Crypto / OKPay) →
// network (TRC20 / BEP20) → deposit page with QR code, copyable address and the
// unique identify amount that verifies the top-up automatically on-chain.
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
export function topupAmountView() {
  const kb = [];
  for(let i = 0; i < QUICK_AMOUNTS.length; i += 2){
    kb.push(QUICK_AMOUNTS.slice(i, i + 2).map((a)=>({
        text: `💵 ${money(a)}`,
        callback_data: `tp_amt:${a}`
      })));
  }
  kb.push([
    {
      text: '✍️ Custom amount',
      callback_data: 'tp_custom'
    }
  ]);
  kb.push([
    {
      text: '⬅️ Back',
      callback_data: 'menu_main'
    }
  ]);
  return {
    text: `${SEP}\n💳 <b>Top Up Balance</b>\n${SEP}\n\n${SEC('💵 <b>Choose an amount</b>')}\nPick a quick amount or enter your own:`,
    keyboard: kb
  };
}
// Page 2 — payment method.
export function topupMethodView(amount) {
  return {
    text: `${SEP}\n💳 <b>Top Up — ${money(amount)}</b>\n${SEP}\n\n${SEC('💠 <b>Payment method</b>')}`,
    keyboard: [
      [
        {
          text: '💎 USDT Crypto',
          callback_data: `tp_usdt:${amount}`
        }
      ],
      [
        {
          text: '⚡ OKPay',
          callback_data: `tp_okpay:${amount}`
        }
      ],
      [
        {
          text: '⬅️ Back',
          callback_data: 'menu_topup'
        }
      ]
    ]
  };
}
// Page 3 — network selection for USDT Crypto.
function topupNetworkView(amount) {
  const kb = NETWORKS.map((n)=>[
      {
        text: `🌐 ${n.badge ? `${n.name} — ${n.badge}` : n.name}`,
        callback_data: `tp_net:${amount}:${n.id}`
      }
    ]);
  kb.push([
    {
      text: '⬅️ Back',
      callback_data: `tp_usdt:${amount}`
    }
  ]);
  return {
    text: `${SEP}\n💎 <b>USDT Crypto — ${money(amount)}</b>\n${SEP}\n\n${SEC('🌐 <b>Select network</b>')}\nChoose the network you will send USDT on:`,
    keyboard: kb
  };
}
// Page 4 — deposit page: QR code photo, then address + identify amount.
async function showDepositPage(base44, token, user, chatId, msgId, amount, networkId) {
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
  const title = isTon ? 'TON (USDT) Recharge' : networkId === 'BEP20' ? 'BNB (BEP-20) Recharge' : 'TRON (TRC-20) Recharge';
  const amountText = isTon ? `$${Number(req.identify_amount || 0).toFixed(2)} USDT` : `$${Number(req.identify_amount || 0).toFixed(4)} USDT`;
  const text = `💰 <b>${title}</b>\n${SEP}\n` + `💵 Amount: <b>${amountText}</b>\n` + `⚠️ Send <b>EXACTLY</b> this amount\n` + `⏳ Reserved: <b>20 minutes</b>\n${SEP}\n` + `🔒 <b>Wallet Address:</b>\n${req.wallet_address}\n` + `☝️ <i>Tap the address to copy</i>\n${SEP}\n` + `After sending, tap ✅ <b>I Have Paid</b> below.`;
  await tgSendMenu(token, chatId, text, [
    [
      {
        text: '✅ I Have Paid',
        callback_data: `tp_chk:${req.request_id}`
      }
    ]
  ]);
}
// OKPay path — instant order, premium receipt.
async function showOkpayPage(base44, token, user, chatId, msgId, amount) {
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
    const text = `${SEP}\n⚡ <b>OKPay Order Created</b>\n${SEP}\n\n💵 Amount: <b>${money(amount)}</b>\n⏳ Status: <b>Awaiting payment</b>\n${SEP}\n\nTap the button below to pay:`;
    const kb = [
      [
        {
          text: '⚡ Pay with OKPay',
          url: payUrl
        }
      ],
      [
        {
          text: '⬅️ Main Menu',
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
async function checkDepositStatus(base44, token, user, chatId, msgId, requestId) {
  try {
    const res = await base44.asServiceRole.functions.invoke('topUpRequest', {
      action: 'check',
      request_id: requestId,
      user_email: user.email
    });
    const data = res.data || res;
    if (data.error) throw new Error(data.error);
    if (data.status === 'approved') {
      await tgEditMenu(token, chatId, msgId, `${SEP}\n✅ <b>Top-Up Confirmed</b>\n${SEP}\n\nYour deposit was detected on-chain and your balance has been credited.`, [
        [
          {
            text: '⬅️ Main Menu',
            callback_data: 'menu_main'
          }
        ]
      ]);
      return;
    }
    if (data.status === 'rejected') {
      await tgEditMenu(token, chatId, msgId, `${SEP}\n❌ <b>Top-Up Expired</b>\n${SEP}\n\nThis deposit request expired without a matching transfer. Start a new top-up to get a fresh address and identify amount.`, [
        [
          {
            text: '💳 Top Up Again',
            callback_data: 'menu_topup'
          }
        ]
      ]);
      return;
    }
    await tgSend(token, chatId, `⏳ <b>Still pending.</b>\n\nNo matching transfer detected yet. Make sure you sent the exact identify amount, then check again in a few minutes.`);
  } catch (err) {
    await tgSend(token, chatId, `❌ ${errText(err)}`);
  }
}
// Routes every tp_* inline-button press of the Top Up flow.
export async function handleTopupCallback(base44, token, cq, user, lang, chatId, msgId) {
  const cbData = cq.data || '';
  if (!user) {
    await tgSend(token, chatId, t(lang || 'en', 'bind.required'));
    return;
  }
  const tid = String(cq.from.id);
  if (cbData.startsWith('tp_amt:')) {
    const v = topupMethodView(Number(cbData.slice(7)));
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData === 'tp_custom') {
    await setState(base44, `topup:${tid}`, JSON.stringify({
      amount: null,
      status: 'awaiting_amount',
      msgs: []
    }));
    await tgEditMenu(token, chatId, msgId, `${SEP}\n✍️ <b>Custom Amount</b>\n${SEP}\n\nType the amount you want to top up:\nExample: <code>50</code>`, []);
    return;
  }
  if (cbData.startsWith('tp_usdt:')) {
    const v = topupNetworkView(Number(cbData.slice(8)));
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData.startsWith('tp_net:')) {
    const [, amountRaw, networkId] = cbData.split(':');
    await showDepositPage(base44, token, user, chatId, msgId, Number(amountRaw), networkId);
    return;
  }
  if (cbData.startsWith('tp_okpay:')) {
    await showOkpayPage(base44, token, user, chatId, msgId, Number(cbData.slice(9)));
    return;
  }
  if (cbData.startsWith('tp_chk:')) {
    await checkDepositStatus(base44, token, user, chatId, msgId, cbData.slice(7));
    return;
  }
}