// The bot's Withdraw — a multi-page professional wizard mirroring the app:
// amount picker ($2…$1000 + custom) → network (BNB Chain / Polygon / TON) →
// wallet address. Every withdrawal carries a $0.10 transaction fee that is
// deducted from the balance IN ADDITION to the requested amount, so the user
// must always keep the fee in their account.
// Every screen is localized through t(lang, ...) with English fallback.
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
export function withdrawAmountView(balance, lang) {
  const L = lang || 'en';
  const kb = [];
  for(let i = 0; i < QUICK_AMOUNTS.length; i += 2){
    kb.push(QUICK_AMOUNTS.slice(i, i + 2).map((a)=>({
        text: `💵 ${money(a)}`,
        callback_data: `wd_amt:${a}`
      })));
  }
  kb.push([
    {
      text: t(L, 'wd.customAmount'),
      callback_data: 'wd_custom'
    }
  ]);
  kb.push([
    {
      text: t(L, 'c.back'),
      callback_data: 'menu_main'
    }
  ]);
  return {
    text: `${SEP}\n${t(L, 'wd.title')}\n${SEP}\n\n${SEC(t(L, 'wd.amountSec'))}\n${t(L, 'wd.balance', { balance: money(balance) })}\n${t(L, 'wd.fee')}\n\n${t(L, 'wd.amountPrompt')}`,
    keyboard: kb
  };
}
// Page 2 — network selection for the payout.
export function withdrawNetworkView(amount, balance, lang) {
  const L = lang || 'en';
  const kb = NETWORKS.map((n)=>[
      {
        text: `🌐 ${n.name} — ${n.badge}`,
        callback_data: `wd_net:${amount}:${n.id}`
      }
    ]);
  kb.push([
    {
      text: t(L, 'c.back'),
      callback_data: 'menu_withdraw'
    }
  ]);
  return {
    text: `${SEP}\n${t(L, 'wd.netTitle', { amount: money(amount) })}\n${SEP}\n\n${SEC(t(L, 'wd.netSec'))}\n${t(L, 'wd.balance', { balance: money(balance) })}\n${t(L, 'wd.feeShort')}\n${t(L, 'wd.youReceive', { amount: money(amount) })}\n\n${t(L, 'wd.netPrompt')}`,
    keyboard: kb
  };
}
// Page 3 — wallet address prompt (the address arrives as a text message).
export function withdrawAddressView(amount, networkId, lang) {
  const L = lang || 'en';
  const n = netById(networkId);
  const example = networkId === 'TON' ? '<code>EQ…your TON address</code>' : '<code>0x…your wallet address</code>';
  return {
    text: `${SEP}\n${t(L, 'wd.netTitle', { amount: money(amount) })}\n${SEP}\n\n${SEC(`🌐 ${n.name} — ${n.badge}`)}\n${t(L, 'wd.feeShort')}\n${t(L, 'wd.youReceive', { amount: money(amount) })}\n\n${t(L, 'wd.addrPrompt', { network: n.name })}\n${t(L, 'wd.example', { example })}`,
    keyboard: [
      [
        {
          text: t(L, 'c.back'),
          callback_data: `wd_amt:${amount}`
        }
      ]
    ]
  };
}
// Validates amount + fee against the live balance. Returns the balance on
// success, or a ready-to-send error view when the fee cannot be covered.
export async function checkWithdrawBalance(base44, user, amount, lang) {
  const L = lang || 'en';
  const balance = await getRealBalance(base44, user.email);
  const required = Number((amount + WD_FEE).toFixed(2));
  if (balance < required) {
    return {
      balance,
      error: `${SEP}\n${t(L, 'wd.insufficient')}\n${SEP}\n\n${SEC(t(L, 'wd.request'))}\n${t(L, 'wd.withdraw', { amount: money(amount) })}\n${t(L, 'wd.feeLine', { fee: money(WD_FEE) })}\n${t(L, 'wd.required', { required: money(required) })}\n${SEC(t(L, 'wd.yourBalance'))}\n${money(balance)}\n\n${t(L, 'wd.feeNote')}`
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
  const L = lang || 'en';
  if (!user) {
    await tgSend(token, chatId, t(L, 'bind.required'));
    return;
  }
  const tid = String(cq.from.id);
  if (cbData.startsWith('wd_amt:')) {
    const amount = Number(cbData.slice(7));
    const { balance, error } = await checkWithdrawBalance(base44, user, amount, L);
    if (error) {
      await tgEditMenu(token, chatId, msgId, error, [
        [
          {
            text: t(L, 'c.back'),
            callback_data: 'menu_withdraw'
          }
        ]
      ]);
      return;
    }
    const v = withdrawNetworkView(amount, balance, L);
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
    await tgEditMenu(token, chatId, msgId, `${SEP}\n${t(L, 'wd.customTitle')}\n${SEP}\n\n${t(L, 'wd.customPrompt')}`, []);
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
    const v = withdrawAddressView(amount, networkId, L);
    await tgEditMenu(token, chatId, msgId, v.text, v.keyboard);
    return;
  }
}