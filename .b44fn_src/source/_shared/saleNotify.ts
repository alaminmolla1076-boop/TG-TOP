import { notifyUser, resolveUserChatId } from './adminNotify.ts';
import { ACCEPTED_COUNTRIES } from './acceptedCountries.js';

// Professional "New Sale" notification sent to the SELLER's Telegram chat
// whenever a buyer purchases their stock: buyer name, number of accounts,
// sale amount and country flag. Localized in the seller's own bot language
// (BotState key "lang:<telegramId>"); English fallback.

const L = {
  title: {
    en: 'New Sale!', bn: 'নতুন বিক্রয়!', hi: 'नई बिक्री!', zh: '新售出！',
    es: '¡Nueva venta!', ar: 'عملية بيع جديدة!', fr: 'Nouvelle vente !',
    ru: 'Новая продажа!', pt: 'Nova venda!', de: 'Neuer Verkauf!'
  },
  buyer: {
    en: 'Buyer', bn: 'ক্রেতা', hi: 'खरीदार', zh: '买家', es: 'Comprador',
    ar: 'المشتري', fr: 'Acheteur', ru: 'Покупатель', pt: 'Comprador', de: 'Käufer'
  },
  country: {
    en: 'Country', bn: 'দেশ', hi: 'देश', zh: '国家', es: 'País', ar: 'الدولة',
    fr: 'Pays', ru: 'Страна', pt: 'País', de: 'Land'
  },
  accounts: {
    en: 'Accounts Sold', bn: 'বিক্রি হওয়া একাউন্ট', hi: 'बेचे गए अकाउंट', zh: '售出账户',
    es: 'Cuentas vendidas', ar: 'الحسابات المبيعة', fr: 'Comptes vendus',
    ru: 'Продано аккаунтов', pt: 'Contas vendidas', de: 'Verkaufte Konten'
  },
  amount: {
    en: 'Sale Amount', bn: 'বিক্রয় মূল্য', hi: 'बिक्री राशि', zh: '销售金额',
    es: 'Monto de la venta', ar: 'مبلغ البيع', fr: 'Montant de la vente',
    ru: 'Сумма продажи', pt: 'Valor da venda', de: 'Verkaufsbetrag'
  },
  pool: {
    en: 'Stock Pool', bn: 'স্টক পুল', hi: 'स्टॉक पूल', zh: '库存池',
    es: 'Grupo de stock', ar: 'مجموعة المخزون', fr: 'Groupe de stock',
    ru: 'Пул запаса', pt: 'Grupo de estoque', de: 'Bestandspool'
  },
  spam: {
    en: 'Spam', bn: 'স্প্যাম', hi: 'स्पैम', zh: '垃圾', es: 'Spam',
    ar: 'سبام', fr: 'Spam', ru: 'Спам', pt: 'Spam', de: 'Spam'
  },
  nonspam: {
    en: 'Non-Spam', bn: 'নন-স্প্যাম', hi: 'नॉन-स्पैम', zh: '非垃圾', es: 'No spam',
    ar: 'غير سبام', fr: 'Non-spam', ru: 'Не спам', pt: 'Não spam', de: 'Kein Spam'
  },
  note: {
    en: 'Thank you for selling on TG TOP!',
    bn: 'TG TOP-এ বিক্রি করার জন্য ধন্যবাদ!',
    hi: 'TG TOP पर बिक्री के लिए धन्यवाद!',
    zh: '感谢您在 TG TOP 上销售！',
    es: '¡Gracias por vender en TG TOP!',
    ar: 'شكراً للبيع على TG TOP!',
    fr: 'Merci de vendre sur TG TOP !',
    ru: 'Спасибо за продажу на TG TOP!',
    pt: 'Obrigado por vender no TG TOP!',
    de: 'Danke für den Verkauf auf TG TOP!'
  }
};

function label(lang, key) {
  const m = L[key];
  return (m && (m[lang] || m.en)) || '';
}

function money(n) {
  return '$' + Number(n || 0).toFixed(2);
}

// Resolves the seller's chosen bot language (BotState "lang:<telegramId>").
async function sellerLang(base44, email) {
  try {
    const chatId = await resolveUserChatId(base44, email);
    if (!chatId) return 'en';
    const rows = await base44.asServiceRole.entities.BotState.filter({ key: `lang:${chatId}` });
    return rows[0]?.value || 'en';
  } catch {
    return 'en';
  }
}

// Buyer display name: @username, or the profile name, or a dash.
function buyerName(buyer) {
  const username = String(buyer?.username || '').trim().replace(/^@/, '');
  if (username) return `@${username}`;
  const name = String(buyer?.name || '').trim();
  if (name) return name;
  return '—';
}

// Sends the sale notification to one seller's Telegram chat.
// p: { seller_email, buyer: {username, name}, count, total, country_iso, spam }
export async function notifySellerOfPurchase(base44, p) {
  try {
    if (!p?.seller_email) return;
    const lang = await sellerLang(base44, p.seller_email);
    const flag = (ACCEPTED_COUNTRIES.find((c) => c.iso === p.country_iso) || {}).flag || '🌐';
    const lines = [
      `🎉 <b>${label(lang, 'title')}</b>`,
      '',
      `👤 ${label(lang, 'buyer')}: <b>${buyerName(p.buyer)}</b>`,
      `🌍 ${label(lang, 'country')}: <b>${flag} ${p.country_iso || '-'}</b>`,
      `📦 ${label(lang, 'accounts')}: <b>${p.count}</b>`,
      `💰 ${label(lang, 'amount')}: <b>${money(p.total)}</b>`,
      ...(p.spam === true || p.spam === false
        ? [`🧷 ${label(lang, 'pool')}: <b>${label(lang, p.spam ? 'spam' : 'nonspam')}</b>`]
        : []),
      `🕐 ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`,
      '',
      `🙏 ${label(lang, 'note')}`
    ];
    await notifyUser(base44, p.seller_email, lines.join('\n'), null);
  } catch (e) {
    console.error('seller sale notify failed:', e?.message);
  }
}