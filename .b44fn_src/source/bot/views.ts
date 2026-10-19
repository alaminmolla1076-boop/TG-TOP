import { t } from '../_shared/botTranslations.js';
// Text builders for the bot's list/summary screens — unchanged port.
export async function formatCountries(base44, lang) {
  const L = lang || 'en';
  const countries = await base44.asServiceRole.entities.Country.filter({
    active: true
  });
  if (!countries.length) return 'No countries available.';
  const lines = countries.slice(0, 40).map((c)=>`${c.flag || '🌍'} <b>${c.name}</b> (${c.iso}) — ${c.dial_code || ''}\n   ${t(L, 'countries.price')}: $${c.price} | ${t(L, 'countries.stock')}: ${c.stock || 0}`);
  let text = `${t(L, 'countries.title')}\n\n${lines.join('\n\n')}`;
  if (countries.length > 40) text += `\n\n...and ${countries.length - 40} more`;
  return text;
}
export async function formatProducts(base44, category, lang) {
  const L = lang || 'en';
  const products = await base44.asServiceRole.entities.Product.filter({
    active: true,
    category
  });
  if (!products.length) return `No ${category} products available.`;
  const lines = products.map((p)=>`• <b>${p.name}</b> — $${p.price}${p.unit_label ? ` (${p.unit_label})` : ''}`);
  return `${t(L, category === 'premium' ? 'products.premiumTitle' : 'products.starsTitle')}\n\n${lines.join('\n')}`;
}
async function loadUserRecords(base44, email) {
  return await Promise.all([
    base44.asServiceRole.entities.ProductOrder.filter({
      user_email: email
    }),
    base44.asServiceRole.entities.TgAccount.filter({
      owner_email: email
    }),
    base44.asServiceRole.entities.TopUp.filter({
      user_email: email
    }),
    base44.asServiceRole.entities.Withdrawal.filter({
      user_email: email
    })
  ]);
}
export async function formatOrders(base44, email, lang) {
  const L = lang || 'en';
  const [productOrders, accounts, topups, withdrawals] = await loadUserRecords(base44, email);
  let text = `${t(L, 'orders.title')}\n\n`;
  if (productOrders.length) {
    text += `<b>${t(L, 'orders.products')}:</b>\n`;
    productOrders.slice(-5).forEach((o)=>{
      text += `• ${o.product_name} — $${o.price} [${o.status}]\n`;
    });
    text += '\n';
  }
  if (accounts.length) {
    text += `<b>${t(L, 'orders.accounts')}:</b>\n`;
    accounts.slice(-5).forEach((a)=>{
      text += `• ${a.phone_number} (${a.country_iso}) — $${a.price} [${a.status}]\n`;
    });
    text += '\n';
  }
  if (topups.length) {
    text += `<b>${t(L, 'orders.topups')}:</b>\n`;
    topups.slice(-5).forEach((tp)=>{
      text += `• $${tp.amount} ${tp.coin} [${tp.status}]\n`;
    });
    text += '\n';
  }
  if (withdrawals.length) {
    text += `<b>${t(L, 'orders.withdrawals')}:</b>\n`;
    withdrawals.slice(-5).forEach((w)=>{
      text += `• $${w.amount} USDT [${w.status}]\n`;
    });
  }
  if (!productOrders.length && !accounts.length && !topups.length && !withdrawals.length) {
    text += t(L, 'orders.none');
  }
  return text;
}
export async function formatStatus(base44, email, lang) {
  const L = lang || 'en';
  const [productOrders, accounts, topups, withdrawals] = await loadUserRecords(base44, email);
  let text = `${t(L, 'status.title')}\n\n`;
  const lastProduct = productOrders[productOrders.length - 1];
  const lastAccount = accounts[accounts.length - 1];
  const lastTopup = topups[topups.length - 1];
  const lastWithdrawal = withdrawals[withdrawals.length - 1];
  text += lastProduct ? `• <b>${t(L, 'status.lastProduct')}:</b> ${lastProduct.product_name} [${lastProduct.status}]\n` : `• ${t(L, 'status.noProduct')}\n`;
  text += lastAccount ? `• <b>${t(L, 'status.lastAccount')}:</b> ${lastAccount.phone_number} [${lastAccount.status}]\n` : `• ${t(L, 'status.noAccount')}\n`;
  text += lastTopup ? `• <b>${t(L, 'status.lastTopup')}:</b> $${lastTopup.amount} ${lastTopup.coin} [${lastTopup.status}]\n` : `• ${t(L, 'status.noTopup')}\n`;
  text += lastWithdrawal ? `• <b>${t(L, 'status.lastWithdrawal')}:</b> $${lastWithdrawal.amount} USDT [${lastWithdrawal.status}]` : `• ${t(L, 'status.noWithdrawal')}`;
  return text;
}
