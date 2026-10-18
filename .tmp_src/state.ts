// Per-request BotState cache + user lookups for the Telegram bot.
// Direct port of the state helpers from base44 pollTelegramUpdates.
// Request-scoped cache so the same key is never queried twice while handling
// one update — the bot's biggest latency source.
export const stateCache = new Map();
// Fetch many keys in ONE query and cache them (misses cached as null).
export async function prefetchStates(base44, keys) {
  const missing = keys.filter((k)=>!stateCache.has(k));
  if (!missing.length) return;
  let records = [];
  try {
    records = await base44.asServiceRole.entities.BotState.filter({
      key: {
        $in: missing
      }
    });
  } catch  {}
  for (const k of missing)stateCache.set(k, null);
  for (const r of records)stateCache.set(r.key, r);
}
export async function getState(base44, key) {
  if (stateCache.has(key)) return stateCache.get(key);
  const records = await base44.asServiceRole.entities.BotState.filter({
    key
  });
  const rec = records[0] || null;
  stateCache.set(key, rec);
  return rec;
}
export async function setState(base44, key, value) {
  const existing = await getState(base44, key);
  if (existing) {
    await base44.asServiceRole.entities.BotState.update(existing.id, {
      value: String(value)
    });
    stateCache.set(key, {
      ...existing,
      value: String(value)
    });
  } else {
    const created = await base44.asServiceRole.entities.BotState.create({
      key,
      value: String(value)
    });
    stateCache.set(key, created || null);
  }
}
export async function clearState(base44, key) {
  const existing = await getState(base44, key);
  if (existing) await base44.asServiceRole.entities.BotState.delete(existing.id);
  stateCache.set(key, null);
}
// Combined fetch of user language + public settings in a SINGLE BotState query.
export async function getUserContext(base44, telegramId) {
  try {
    const keys = [
      `lang:${String(telegramId)}`,
      'setting:premium_hidden',
      'setting:stars_hidden',
      'setting:maintenance_mode',
      'setting:maintenance_message'
    ];
    await prefetchStates(base44, keys);
    const map = {};
    for (const k of keys){
      const rec = stateCache.get(k);
      if (rec) map[k] = rec.value;
    }
    return {
      lang: map[`lang:${String(telegramId)}`] || 'en',
      settings: {
        premium_hidden: map['setting:premium_hidden'] === 'true',
        stars_hidden: map['setting:stars_hidden'] === 'true',
        maintenance_mode: map['setting:maintenance_mode'] === 'true',
        maintenance_message: map['setting:maintenance_message'] || ''
      }
    };
  } catch  {
    return {
      lang: 'en',
      settings: {
        premium_hidden: false,
        stars_hidden: false,
        maintenance_mode: false,
        maintenance_message: ''
      }
    };
  }
}
// Resolves the person behind a Telegram id. The Telegram identity is the single
// money key, so every balance/order lookup runs against it — no app account
// (User row) is required.
export async function findUserByTelegramId(base44, telegramId) {
  const id = String(telegramId);
  const identityEmail = `tg${id}@telegram.local`;
  // Both lookups in parallel — one round-trip instead of two.
  const [users, webUsers] = await Promise.all([
    base44.asServiceRole.entities.User.filter({
      telegram_id: id
    }),
    base44.asServiceRole.entities.TgWebUser.filter({
      telegram_id: id
    })
  ]);
  if (users[0]) {
    return {
      ...users[0],
      login_email: users[0].email,
      email: identityEmail
    };
  }
  const w = webUsers[0];
  if (w && w.banned) return null;
  return {
    id: w?.id || null,
    email: identityEmail,
    login_email: null,
    role: 'user',
    telegram_id: id,
    telegram_username: w?.telegram_username || '',
    telegram_first_name: w?.telegram_first_name || '',
    telegram_last_name: w?.telegram_last_name || ''
  };
}
export async function findUserByBindCode(base44, code) {
  const users = await base44.asServiceRole.entities.User.list();
  const upper = String(code).toUpperCase();
  return users.find((u)=>(u.telegram_bind_code || '').toUpperCase() === upper) || null;
}
