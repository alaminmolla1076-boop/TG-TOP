import { t, buildReplyKeyboard } from '../_shared/botTranslations.js';
// The main menu also ships as the bot reply keyboard — Telegram then shows the
// "four-dot" toggle in the input field. Presses route via buildAllReplyActions
// in pollTelegramUpdates.
export function mainReplyKeyboard(lang, opts) {
  return buildReplyKeyboard(lang, opts);
}
// Keyboards and deposit addresses for the Telegram bot — unchanged port.
// USDT deposit addresses (mirrors the app's Top-Up page)
export const DEPOSIT_ADDRESSES = [
  {
    label: 'TRX',
    address: 'TLrv3EJEbGfEJgGbjQi3Yi1Yc88mn9mDxn'
  },
  {
    label: 'BEP-20',
    address: '0x2a62cd712863028804a5789629c23d842990aded'
  },
  {
    label: 'POL',
    address: '0x2a62cd712863028804a5789629c23d842990aded'
  },
  {
    label: 'TON',
    address: 'UQB5vp_yQ4L-EheVHn4df--zU1XDuRX_tMSCc7WEB-PGuGv6'
  },
  {
    label: 'AVAX-C',
    address: '0x2a62cd712863028804a5789629c23d842990aded'
  }
];
// Main menu — the full app-feature set as INLINE buttons (two per row),
// mirroring the reply keyboard.
export function mainMenuKeyboard(lang, opts) {
  const L = lang || 'en';
  const btn = (label, data)=>({
      text: t(L, label),
      callback_data: data
    });
  const kb = [
    [btn('menu.buy', 'menu_buy'), btn('menu.topup', 'menu_topup')],
    [btn('menu.sell', 'menu_sell'), btn('menu.withdraw', 'menu_withdraw')],
    [btn('menu.myaccount', 'menu_myaccount')]
  ];
  kb.push([btn('menu.channel', 'menu_channel'), btn('menu.support', 'menu_support')]);
  kb.push([btn('menu.language', 'menu_language'), btn('menu.refer', 'menu_refer')]);
  return kb;
}
// The whole country list always fits within MAX_PAGES pages (2 per row).
const MAX_PAGES = 6;
// Country list keyboard with dial codes + search button. A query sorts matching
// countries to the top instead of filtering them out.
export function buildCountryKeyboard(countries, lang, query, page) {
  let sorted = countries;
  if (query) {
    const q = query.toLowerCase().trim();
    const qNorm = q.replace(/^\+/, '');
    const matches = [];
    const rest = [];
    for (const c of countries){
      const iso = (c.iso || '').toLowerCase();
      const dial = (c.dial_code || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      if (iso === q || iso.includes(q) || dial === q || dial === qNorm || name.includes(q)) matches.push(c);
      else rest.push(c);
    }
    sorted = [
      ...matches,
      ...rest
    ];
  }
  let perPage = Math.max(2, Math.ceil(sorted.length / MAX_PAGES));
  if (perPage % 2 !== 0) perPage += 1;
  if (perPage > 30) perPage = 30;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(Math.max(1, page || 1), totalPages);
  const pageItems = sorted.slice((currentPage - 1) * perPage, (currentPage - 1) * perPage + perPage);
  const keyboard = [];
  for(let i = 0; i < pageItems.length; i += 2){
    const row = [];
    for(let j = i; j < Math.min(i + 2, pageItems.length); j++){
      const c = pageItems[j];
      const dial = c.dial_code ? String(c.dial_code).startsWith('+') ? c.dial_code : '+' + c.dial_code : '';
      row.push({
        text: `${c.flag || '🌍'} ${c.iso} ${dial} $${c.price} (${c.stock || 0})`,
        callback_data: `buyctry:${c.iso}`
      });
    }
    keyboard.push(row);
  }
  const navRow = [];
  if (currentPage > 1) navRow.push({
    text: `⬅️ ${t(lang, 'buy.back')}`,
    callback_data: `buypage:${currentPage - 1}`
  });
  navRow.push({
    text: `${currentPage}/${totalPages}`,
    callback_data: 'noop'
  });
  if (currentPage < totalPages) navRow.push({
    text: `${t(lang, 'buy.next')} ➡️`,
    callback_data: `buypage:${currentPage + 1}`
  });
  keyboard.push(navRow);
  keyboard.push([
    {
      text: t(lang, 'buy.searchBtn'),
      callback_data: 'buysearch'
    }
  ]);
  return keyboard;
}