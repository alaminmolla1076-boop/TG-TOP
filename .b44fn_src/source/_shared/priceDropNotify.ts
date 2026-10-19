import { tgSend } from './telegramApi.ts';
import { secrets, waitUntil } from './b44.ts';

// Price-drop broadcast: when a seller LOWERS the price of their stock for a
// country, every user gets a small, localized notice in their bot chat —
// who dropped it, country with flag, Spam / Non-Spam pool, old and new price.

// Localized title per bot language (bot_state key "lang:<telegramId>");
// everything else in the message is language-neutral (names, prices, flags).
const TITLES = {
  en: 'Price Drop!',
  bn: 'দাম কমেছে!',
  hi: 'कीमत गिर गई!',
  zh: '价格下调！',
  es: '¡Baja de precio!',
  ar: 'انخفاض السعر!',
  fr: 'Baisse de prix !',
  ru: 'Снижение цены!',
  pt: 'Queda de preço!',
  de: 'Preissturz!'
};

// The stock pools are the marketplace's own product terms — kept verbatim.
const POOLS = {
  spam: '⚠️ Spam',
  nonspam: '✅ Non-Spam',
  mixed: '⚠️ Spam + ✅ Non-Spam'
};

// Regional-indicator emoji from a 2-letter country code (US -> 🇺🇸).
export function flagOf(iso) {
  return String(iso || '')
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function money(n) {
  return '$' + Number(n).toFixed(2);
}

export function buildPriceDropMessage(lang, p) {
  const title = TITLES[lang] || TITLES.en;
  const who = p.sellerUsername
    ? (String(p.sellerUsername).startsWith('@') ? p.sellerUsername : '@' + p.sellerUsername)
    : (p.sellerName || '');
  const lines = [`📉 <b>${title}</b>`, ``];
  if (who) lines.push(`👤 <b>${who}</b>`);
  lines.push(
    `${flagOf(p.countryIso)} ${p.countryName} · ${POOLS[p.spamPool] || POOLS.nonspam}`,
    `💰 <s>${money(p.oldPrice)}</s> → <b>${money(p.newPrice)}</b>`
  );
  return lines.join('\n');
}

// Sends the notice to every non-banned user with a linked Telegram chat, in
// each user's own bot language, except the seller who made the change.
// Runs in the background (waitUntil) so the price update replies instantly.
export function broadcastPriceDrop(base44, p) {
  waitUntil((async () => {
    try {
      const token = secrets.get('TELEGRAM_BOT_TOKEN');
      if (!token) return;
      const [users, webUsers, states] = await Promise.all([
        base44.asServiceRole.entities.User.filter({}, '-created_date', 1000).catch(() => []),
        base44.asServiceRole.entities.TgWebUser.filter({}, '-created_date', 1000).catch(() => []),
        base44.asServiceRole.entities.BotState.filter({ key: { $ilike: 'lang:%' } }).catch(() => [])
      ]);
      // One bulk read of every language preference (lang:<telegramId>).
      const langOf = new Map();
      for (const s of states) {
        const m = /^lang:(.+)$/.exec(s.key || '');
        if (m) langOf.set(m[1], s.value);
      }
      const seen = new Set();
      const targets = [];
      for (const u of [...(users || []), ...(webUsers || [])]) {
        const id = u.telegram_id ? String(u.telegram_id) : '';
        if (!id || u.banned || seen.has(id)) continue;
        if (p.sellerTelegramId && id === String(p.sellerTelegramId)) continue;
        seen.add(id);
        targets.push({ id, lang: langOf.get(id) || 'en' });
      }
      for (const target of targets.slice(0, 2000)) {
        try {
          await tgSend(token, target.id, buildPriceDropMessage(target.lang, p));
        } catch (e) {
          console.error('priceDrop send failed', target.id, e?.message);
        }
        // Stay under Telegram's ~30 msg/sec broadcast limit.
        await new Promise((r) => setTimeout(r, 60));
      }
    } catch (e) {
      console.error('broadcastPriceDrop failed:', e?.message);
    }
  })());
}