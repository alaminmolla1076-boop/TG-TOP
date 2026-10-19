import { secrets } from './b44.ts';
// Telegram notifications to users and admins — port of base44/shared/adminNotify.js.
// Only the secrets accessor changed; all messaging logic is unchanged.
// Collects every admin Telegram chat id (secret list + admin User records).
async function getAdminChatIds(base44) {
  const chatIds = new Set();
  const secretIds = (secrets.get('ADMIN_TELEGRAM_IDS') || '').split(',').map((s)=>s.trim()).filter(Boolean);
  for (const id of secretIds)chatIds.add(id);
  const users = await base44.asServiceRole.entities.User.list();
  const adminEmails = (secrets.get('ADMIN_EMAILS') || '').split(',').map((e)=>e.trim().toLowerCase()).filter(Boolean);
  const admins = users.filter((u)=>u.role === 'admin' || adminEmails.includes((u.email || '').toLowerCase()) || u.is_owner === true);
  for (const admin of admins){
    if (admin.telegram_id) chatIds.add(String(admin.telegram_id));
  }
  return chatIds;
}
// Resolves a user's Telegram chat id from their (possibly synthetic) email.
export async function resolveUserChatId(base44, email) {
  if (!email) return null;
  const m = /^tg(\d+)@telegram\.local$/i.exec(email.trim());
  if (m) return m[1];
  const users = await base44.asServiceRole.entities.User.list();
  const user = users.find((u)=>(u.email || '').toLowerCase() === email.toLowerCase());
  return user && user.telegram_id ? String(user.telegram_id) : null;
}
// Inline keyboard with the admin-configured support link (via /set_support).
// Returns null when no link is set yet.
export async function supportKeyboard(base44) {
  const rec = await base44.asServiceRole.entities.BotState.filter({
    key: 'setting:support_url'
  });
  const url = rec[0]?.value;
  return url ? [
    [
      {
        text: '🚸 Contact Support',
        url
      }
    ]
  ] : null;
}
async function send(botToken, chatId, text, keyboard) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: String(chatId),
      text,
      parse_mode: 'HTML',
      ...keyboard ? {
        reply_markup: {
          inline_keyboard: keyboard
        }
      } : {}
    })
  });
}
// Sends ONE message about a request to the user and the admins, deduped so a
// single chat (e.g. an admin acting as the user) never gets it twice.
export async function notifyOnce(base44, email, text, keyboard) {
  try {
    const botToken = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) return;
    const chatIds = await getAdminChatIds(base44);
    const userChatId = await resolveUserChatId(base44, email);
    if (userChatId) chatIds.add(userChatId);
    for (const chatId of chatIds){
      try {
        await send(botToken, chatId, text, keyboard);
      } catch (e) {
        console.error('notifyOnce send failed', chatId, e.message);
      }
    }
  } catch (e) {
    console.error('notifyOnce failed:', e.message);
  }
}
export async function notifyAdmins(base44, text, keyboard) {
  try {
    const botToken = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) return;
    const chatIds = await getAdminChatIds(base44);
    for (const chatId of chatIds){
      try {
        await send(botToken, chatId, text, keyboard);
      } catch (e) {
        console.error('Failed to notify admin chat:', chatId, e.message);
      }
    }
  } catch (e) {
    console.error('notifyAdmins failed:', e.message);
  }
}
// Sends a text notification to a single user's Telegram bot chat, looked up by
// email. Handles Telegram identity keys (tg<id>@telegram.local) directly —
// those users may not have a User row at all.
export async function notifyUser(base44, email, text, keyboard) {
  try {
    if (!email) return;
    const botToken = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) return;
    const chatId = await resolveUserChatId(base44, email);
    if (!chatId) return;
    await send(botToken, chatId, text, keyboard);
  } catch (e) {
    console.error('notifyUser failed:', e.message);
  }
}