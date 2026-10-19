// Reward-related message builders used by the Telegram bot.
// Kept out of pollTelegramUpdates to keep that handler small.
import { t } from './botTranslations.js';

const REWARD_PAGES = 4;

// Build one page of the reward-price list plus its Back/Next keyboard.
// The full list is always split into exactly REWARD_PAGES pages.
export async function buildRewardsPage(base44, lang, page) {
  const L = lang || 'en';
  const rewards = await base44.asServiceRole.entities.RewardPrice.filter({ active: true });
  if (!rewards.length) {
    return { text: `${t(L, 'rewards.title')}\n\nNo reward prices available.`, keyboard: [] };
  }
  const perPage = Math.ceil(rewards.length / REWARD_PAGES);
  const totalPages = Math.max(1, Math.ceil(rewards.length / perPage));
  const current = Math.min(Math.max(1, page || 1), totalPages);
  const items = rewards.slice((current - 1) * perPage, current * perPage);
  const lines = items.map(r =>
    `${r.flag || '🌍'} <b>${r.country_name || r.country_iso}</b> (${r.dial_code || ''}) — $${r.reward_price}`
  );
  const nav = [];
  if (current > 1) nav.push({ text: `⬅️ ${t(L, 'buy.back')}`, callback_data: `rewpage:${current - 1}` });
  nav.push({ text: `${current}/${totalPages}`, callback_data: 'noop' });
  if (current < totalPages) nav.push({ text: `${t(L, 'buy.next')} ➡️`, callback_data: `rewpage:${current + 1}` });
  return {
    text: `${t(L, 'rewards.title')}\n\n${lines.join('\n')}`,
    keyboard: [nav],
  };
}

// Build the pending + credited reward summary for one user.
export async function buildUserRewards(base44, email) {
  const sessions = await base44.asServiceRole.entities.SessionRequest.filter({
    user_email: email,
    status: 'completed',
  });
  const now = Date.now();
  let text = '';
  const pending = sessions.filter(s => (s.reward_status === 'pending' || s.reward_status === 'frozen') && s.reward_eligible_at);
  if (pending.length) {
    text += `\n\n⏳ <b>Pending Rewards</b>\n`;
    for (const s of pending) {
      const diff = new Date(s.reward_eligible_at).getTime() - now;
      const flag = s.reward_status === 'frozen' ? '🧊 ' : '';
      if (diff > 0) {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        text += `${flag}• <code>${s.phone_number}</code> — ${days}d ${hours}h ${mins}m | $${s.reward_amount || 0}\n`;
      } else {
        text += `${flag}• <code>${s.phone_number}</code> — ✅ Ready | $${s.reward_amount || 0}\n`;
      }
    }
  }
  const rewarded = sessions.filter(s => s.reward_status === 'rewarded');
  if (rewarded.length) {
    text += `\n✅ <b>Credited Rewards (${rewarded.length})</b>\n`;
    for (const s of rewarded.slice(-10)) {
      text += `• <code>${s.phone_number}</code> — $${s.reward_amount || 0}\n`;
    }
  }
  return text;
}