import { notifyAdmins, notifyUser, resolveUserChatId, supportKeyboard } from './adminNotify.ts';

// Professional money notifications for the bot chat:
//  - Withdrawal submitted  → alert to the admin chats (with a one-tap
//    "Copy Address" button and an Admin Panel link).
//  - Withdrawal reviewed   → notice to the user's own chat.
//  - Top up approved        → notice to the user's own chat.
// User-facing lines are localized in the user's own bot language
// (BotState key "lang:<telegramId>"); admin alerts stay in English.

const ADMIN_URL = 'https://tg-tops.base44.app/admin';
const FEE = 0.1;

// Localized strings — 10 bot languages, English fallback.
const L = {
  withdrawOkTitle: {
    en: 'Withdrawal Successful', bn: 'উইথড্র সফল হয়েছে', hi: 'निकासी सफल रही',
    zh: '提现成功', es: 'Retiro exitoso', ar: 'تمت عملية السحب بنجاح',
    fr: 'Retrait réussi', ru: 'Вывод выполнен', pt: 'Saque concluído', de: 'Auszahlung erfolgreich'
  },
  withdrawNoTitle: {
    en: 'Withdrawal Rejected', bn: 'উইথড্র বাতিল হয়েছে', hi: 'निकासी अस्वीकृत',
    zh: '提现被拒绝', es: 'Retiro rechazado', ar: 'تم رفض السحب',
    fr: 'Retrait refusé', ru: 'Вывод отклонён', pt: 'Saque recusado', de: 'Auszahlung abgelehnt'
  },
  topupOkTitle: {
    en: 'Top Up Successful', bn: 'টপ আপ সফল হয়েছে', hi: 'रिचार्ज सफल रहा',
    zh: '充值成功', es: 'Recarga exitosa', ar: 'تمت عملية الشحن بنجاح',
    fr: 'Recharge réussie', ru: 'Пополнение выполнено', pt: 'Recarga concluída', de: 'Aufladung erfolgreich'
  },
  amount: {
    en: 'Amount', bn: 'পরিমাণ', hi: 'राशि', zh: '金额', es: 'Monto', ar: 'المبلغ',
    fr: 'Montant', ru: 'Сумма', pt: 'Valor', de: 'Betrag'
  },
  fee: {
    en: 'Fee', bn: 'ফি', hi: 'शुल्क', zh: '手续费', es: 'Comisión', ar: 'العمولة',
    fr: 'Frais', ru: 'Комиссия', pt: 'Taxa', de: 'Gebühr'
  },
  network: {
    en: 'Network', bn: 'নেটওয়ার্ক', hi: 'नेटवर्क', zh: '网络', es: 'Red', ar: 'الشبكة',
    fr: 'Réseau', ru: 'Сеть', pt: 'Rede', de: 'Netzwerk'
  },
  address: {
    en: 'Address', bn: 'ঠিকানা', hi: 'पता', zh: '地址', es: 'Dirección', ar: 'العنوان',
    fr: 'Adresse', ru: 'Адрес', pt: 'Endereço', de: 'Adresse'
  },
  balance: {
    en: 'New Balance', bn: 'নতুন ব্যালেন্স', hi: 'नया बैलेंस', zh: '新余额', es: 'Nuevo saldo',
    ar: 'الرصيد الجديد', fr: 'Nouveau solde', ru: 'Новый баланс', pt: 'Novo saldo', de: 'Neuer Kontostand'
  },
  withdrawOkNote: {
    en: 'Your funds are being sent to your wallet and should arrive within a few minutes.',
    bn: 'আপনার টাকা আপনার ওয়ালেটে পাঠানো হচ্ছে, কয়েক মিনিটের মধ্যে পৌঁছে যাবে।',
    hi: 'आपका धन आपके वॉलेट में भेज दिया जा रहा है और कुछ मिनटों में आ जाएगा।',
    zh: '您的资金正在发送至您的钱包，几分钟内即可到账。',
    es: 'Tus fondos se están enviando a tu billetera y llegarán en unos minutos.',
    ar: 'يتم إرسال أموالك إلى محفظتك وستصل خلال دقائق قليلة.',
    fr: 'Vos fonds sont en cours d’envoi vers votre portefeuille et arriveront dans quelques minutes.',
    ru: 'Ваши средства отправляются на ваш кошелёк и поступят в течение нескольких минут.',
    pt: 'Seus fundos estão sendo enviados para sua carteira e chegarão em alguns minutos.',
    de: 'Ihre Gelder werden an Ihre Wallet gesendet und kommen in wenigen Minuten an.'
  },
  withdrawNoNote: {
    en: 'Your request could not be processed. The held amount has been returned to your balance.',
    bn: 'আপনার রিকোয়েস্টটি প্রসেস করা যায়নি। ধরে রাখা টাকা আপনার ব্যালেন্সে ফেরত দেওয়া হয়েছে।',
    hi: 'आपका अनुरोध पूरा नहीं हो सका। रोकी गई राशि आपके बैलेंस में वापस कर दी गई है।',
    zh: '您的请求无法处理。冻结的款项已退回到您的余额。',
    es: 'Tu solicitud no pudo procesarse. El monto retenido ha sido devuelto a tu saldo.',
    fr: 'Votre demande n’a pas pu être traitée. Le montant retenu a été restitué sur votre solde.',
    ru: 'Ваш запрос не удалось обработать. Задержанная сумма возвращена на ваш баланс.',
    pt: 'Sua solicitação não pôde ser processada. O valor retido foi devolvido ao seu saldo.',
    de: 'Ihre Anfrage konnte nicht bearbeitet werden. Der reservierte Betrag wurde Ihrem Guthaben zurückerstattet.'
  },
  creditedNote: {
    en: 'Your top up has been credited to your balance. Thank you!',
    bn: 'আপনার টপ আপটি আপনার ব্যালেন্সে যোগ হয়েছে। ধন্যবাদ!',
    hi: 'आपका रिचार्ज आपके बैलेंस में जोड़ दिया गया है। धन्यवाद!',
    zh: '您的充值已到账。谢谢！',
    es: 'Tu recarga ha sido acreditada a tu saldo. ¡Gracias!',
    ar: 'تمت إضافة الشحن إلى رصيدك. شكراً لك!',
    fr: 'Votre recharge a été créditée sur votre solde. Merci !',
    ru: 'Ваше пополнение зачислено на баланс. Спасибо!',
    pt: 'Sua recarga foi creditada no seu saldo. Obrigado!',
    de: 'Ihre Aufladung wurde Ihrem Guthaben gutgeschrieben. Danke!'
  }
};

function label(lang, key) {
  const m = L[key];
  return (m && (m[lang] || m.en)) || '';
}

function money(n) {
  return '$' + Number(n || 0).toFixed(2);
}

// Resolves the user's chosen bot language (BotState "lang:<telegramId>").
async function userLang(base44, email) {
  try {
    const chatId = await resolveUserChatId(base44, email);
    if (!chatId) return 'en';
    const rows = await base44.asServiceRole.entities.BotState.filter({ key: `lang:${chatId}` });
    return rows[0]?.value || 'en';
  } catch {
    return 'en';
  }
}

// Formats a user identity line for admin alerts: @username, or the
// profile name, or the e-mail when neither is on record.
export function adminIdentityLine(user) {
  const username = String(user?.telegram_username || '').trim().replace(/^@/, '');
  if (username) return `👤 User: <b>@${username}</b>`;
  if (user?.full_name) return `👤 User: <b>${user.full_name}</b>`;
  return `👤 User: <code>${user?.email || 'unknown'}</code>`;
}

// ── Withdrawal submitted → professional alert to the admin chats ──
export function buildWithdrawalRequestMessage(p) {
  return [
    '📤 <b>New Withdrawal Request</b>',
    '',
    p.identity,
    `💰 Amount: <b>${money(p.amount)}</b>`,
    `🧾 Fee: <b>${money(FEE)}</b>`,
    `🌐 Network: <b>${p.network}</b>`,
    `🏦 Address: <code>${p.address}</code>`,
    `🆔 Request ID: <code>${p.id}</code>`,
    `🕐 Time: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`,
    '',
    `➡️ Please review it in the Admin Panel: ${ADMIN_URL}`
  ].join('\n');
}

export function withdrawalRequestKeyboard(p) {
  return [
    [{ text: '📋 Copy Address', copy_text: { text: p.address } }],
    [{ text: '⚙️ Review in Admin Panel', url: ADMIN_URL }]
  ];
}

export async function notifyWithdrawalRequest(base44, p) {
  await notifyAdmins(base44, buildWithdrawalRequestMessage(p), withdrawalRequestKeyboard(p));
}

// ── Withdrawal reviewed → professional notice to the user's chat ──
export async function notifyWithdrawalDecision(base44, email, status, withdrawal, balance) {
  const lang = await userLang(base44, email);
  const ok = status === 'approved';
  const lines = [
    `${ok ? '✅' : '❌'} <b>${label(lang, ok ? 'withdrawOkTitle' : 'withdrawNoTitle')}</b>`,
    '',
    `💸 ${label(lang, 'amount')}: <b>${money(withdrawal.amount)}</b>`,
    `🧾 ${label(lang, 'fee')}: <b>${money(FEE)}</b>`,
    `🌐 ${label(lang, 'network')}: <b>${withdrawal.network || '-'}</b>`,
    `🏦 ${label(lang, 'address')}: <code>${withdrawal.wallet_address || '-'}</code>`,
    ...(balance !== null && balance !== undefined
      ? [`💵 ${label(lang, 'balance')}: <b>${money(balance)}</b>`]
      : []),
    '',
    `ℹ️ ${label(lang, ok ? 'withdrawOkNote' : 'withdrawNoNote')}`
  ];
  const keyboard = ok ? null : await supportKeyboard(base44);
  await notifyUser(base44, email, lines.join('\n'), keyboard);
}

// ── Top up reviewed/approved → professional notice to the user's chat ──
export async function notifyTopUpDecision(base44, email, status, topup, balance) {
  const lang = await userLang(base44, email);
  const ok = status === 'approved';
  const lines = [
    `${ok ? '✅' : '❌'} <b>${label(lang, 'topupOkTitle')}</b>`,
    '',
    `💸 ${label(lang, 'amount')}: <b>${money(topup.amount)} ${topup.coin || 'USDT'}</b>`,
    `🌐 ${label(lang, 'network')}: <b>${topup.network || 'OKPAY'}</b>`,
    ...(topup.tx_hash ? [`🔗 Tx ID: <code>${topup.tx_hash}</code>`] : []),
    ...(balance !== null && balance !== undefined
      ? [`💵 ${label(lang, 'balance')}: <b>${money(balance)}</b>`]
      : []),
    '',
    `ℹ️ ${label(lang, ok ? 'creditedNote' : 'withdrawNoNote')}`
  ];
  const keyboard = ok ? null : await supportKeyboard(base44);
  await notifyUser(base44, email, lines.join('\n'), keyboard);
}