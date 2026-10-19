// The bot's Withdraw — a multi-page professional wizard mirroring the app:
// amount picker ($2…$1000 + custom) → network (BNB Chain / Polygon / TON) →
// wallet address. Every withdrawal carries a $0.10 transaction fee that is
// deducted from the balance IN ADDITION to the requested amount, so the user
// must always keep the fee in their account.
import { tgSend, tgSendMenu, tgEditMenu } from '../_shared/telegramApi.ts';
import { t } from '../_shared/botTranslations.js';
import { getRealBalance } from '../_shared/balance.ts';
import { setState } from './state.ts';

const SEP = '━━━━━━━━━━━━━━━━━━';
const SEC = (title)=>`┈┈┈┈ ${title} ┈┈┈┈`;
const money = (n)=>`$${Number(n || 0).toFixed(2)}`;
export const WD_FEE = 0.1;
export const WD_MIN = 1;
const QUICK_AMOUNTS = [
  2,
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
    id: 'BEP20',
    name: 'BNB Chain',
    badge: 'USDT BEP20',
    desc: 'Low fees · fast confirmation'
  },
  {
    id: 'POLYGON',
    name: 'Polygon PoS',
    badge: 'USDT Polygon',
    desc: 'Low fees · fast confirmation'
  },
  {
    id: 'TON',
    name: 'TON Network',
    badge: 'Gram',
    desc: 'Withdraw on The Open Network'
  }
];
const netById = (id)=>NETWORKS.find((n)=>n.id === id) || {
    id,
    name: id,
    badge: id,
    desc: ''
  };
// Page 1 — quick amount grid + custom amount, with the fee shown up front.
export function withdrawAmountView(balance) {
  const kb = [];
  for(let i = 0; i < QUICK_AMOUNTS.length; i += 2){
    kb.push(QUICK_AMOUNTS.slice(i, i + 2).map((a)=>({
        text: `💵 ${money(a)}`,
        callback_data: `wd_amt:${a}`
      })));
  }
  kb.push([
    {
      text: '✍️ Custom amount',
      callback_data: 'wd_custom'
    }
  ]);
  kb.push([
    {
      text: '⬅️ Back',
      callback_data: 'menu_main'
    }
  ]);
  return {
    text: `${SEP}\n💸 <b>Withdraw Funds</b>\n${SEP}\n\n${SEC('💵 <b>Choose an amount</b>')}\n💰 Balance: <b>${money(balance)}</b>\n⚠️ Fee: <b>$0.10</b> per withdrawal\n\nPick a quick amount or enter your own:`,
    keyboard: kb
  };
}
// Page 2 — network selection for the payout.
export function withdrawNetworkView(amount, balance) {
  const kb = NETWORKS.map((n)=>[
      {
        text: `🌐 ${n.name} — ${n.badge}`,
        callback_data: `wd_net:${amount}:${n.id}`
      }
    ]);
  kb.push([
    {
      text: '⬅️ Back',
      callback_data: 'menu_withdraw'
    }
  ]);
  return {
    text: `${SEP}\n💸 <b>Withdraw — ${money(amount)}</b>\n${SEP}\n\n${SEC('🌐 <b>Select network</b>')}\n💰 Balance: <b>${money(balance)}</b>\n⚠️ Fee: <b>$0.10</b>\n💵 You receive: <b>${money(amount)}</b>\n\nChoose the network to receive your funds:`,
    keyboard: kb
  };
}
// Page 3 — wallet address prompt (the address arrives as a text message).
export function withdrawAddressView(amount, networkId) {
  const n = netById(networkId);
  const example = networkId === 'TON' ? '<code>EQ…your TON address</code>' : '<code>0x…your wallet address</code>';
  return {
    text: `${SEP}\n💸 <b>Withdraw — ${money(amount)}</b>\n${SEP}\n\n${SEC(`🌐 ${n.name} — ${n.badge}`)}\n⚠️ Fee: <b>$0.10</b>\n💵 You receive: <b>${money(amount)}</b>\n\nSend your <b>${n.name}</b> wallet address now:\nExample: ${example}`,
    keyboard: [
      [
        {
          text: '⬅️ Back',
          callback_data: `wd_amt:${amount}`
        }
      ]
    ]
  };
}
// Validates amount + fee against the live balance. Returns the balance on
// success, or a ready-to-send error view when the fee cannot be covered.
export async function checkWithdrawBalance(base44, user, amount) {
  const balance = await getRealBalance(base44, user.email);
  const required = Number((amount + WD_FEE).toFixed(2));
  if (balance < required) {
    return {
      balance,
      error: `${SEP}\n❌ <b>Insufficient Balance</b>\n${SEP}\n\n${SEC('💵 <b>Withdraw request</b>')}\nWithdraw: ${money(amount)}\nFee: ${money(WD_FEE)}\nRequired: <b>${money(required)}</b>\n${SEC('💰 <b>Your balance</b>')}\n${money(balance)}\n\nThe $0.10 fee is charged in addition to the amount. Leave the fee in your account and request a smaller amount.`
    };
  }
  return {
    balance,
    error: null
  };
}
// Routes every wd_* inline-button press of the Withdraw flow.
export async function handleWithdrawCallback(base44, token, cq, user, lang, chatId, msgId) {
  const cbData = cq.data || '';
  if (!user) {
    await tgSend(token, chatId, t(lang || 'en', 'bind.required'));
    return;
  }
  const tid = String(cq.from.id);
  if (cbData.startsWith('wd_amt:')) {
    const amount = Number(cbData.slice(7));
    const { balance, error } = await checkWithdrawBalance(base44, user, amount);
    if (error) {
      await tgEditMenu(token, chatId, msgId, error, [
        [
          {
            text: '⬅️ Back',
            callback_data: 'menu_withdraw'
          }
        ]
      ]);
      return;
    }
    const v = withdrawNetworkView(amount, balance);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
  if (cbData === 'wd_custom') {
    await setState(base44, `withdraw:${tid}`, JSON.stringify({
      status: 'awaiting_amount',
      msgs: [
        msgId
      ].filter(Boolean)
    }));
    await tgEditMenu(token, chatId, msgId, `${SEP}\n✍️ <b>Custom Amount</b>\n${SEP}\n\nType the amount you want to withdraw:\n⚠️ Fee: <b>$0.10</b> in addition to the amount\nExample: <code>50</code>`, []);
    return;
  }
  if (cbData.startsWith('wd_net:')) {
    const [, amountRaw, networkId] = cbData.split(':');
    const amount = Number(amountRaw);
    await setState(base44, `withdraw:${tid}`, JSON.stringify({
      amount,
      network: networkId,
      status: 'awaiting_address',
      msgs: [
        msgId
      ].filter(Boolean)
    }));
    const v = withdrawAddressView(amount, networkId);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
}