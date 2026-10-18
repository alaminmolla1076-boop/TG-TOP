import { makeB44, secrets, waitUntil } from '../_shared/b44.ts';
import { t, buildAllReplyActions } from '../_shared/botTranslations.js';
import { tgSend, tgSetCommands } from '../_shared/telegramApi.ts';
import { stateCache, prefetchStates, getState, setState, clearState, getUserContext, findUserByTelegramId } from '../bot/state.ts';
import handleCallback from '../bot/callbacks.ts';
import handleCommand from '../bot/commands.ts';
import { handleDocument, handleBuySearch, handleNumericFlows, handleSellFlow, handleTextFlows } from '../bot/flows.ts';
// Every translated reply-keyboard button text → command action (all languages).
const REPLY_MENU_ACTIONS = buildAllReplyActions();
// Routes one Telegram update: callback query, document upload, or text message.
async function processUpdate(base44, token, update) {
  if (update.callback_query) {
    await handleCallback(base44, token, update.callback_query);
    return;
  }
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const tgUser = msg.from;
  if (msg.document && tgUser) {
    await handleDocument(base44, token, msg, tgUser);
    return;
  }
  if (!msg.text || !tgUser) return;
  const replyTo = msg.message_id;
  const tid = String(tgUser.id);
  // The user record plus every per-chat state key this handler may read, in two
  // parallel queries — everything after this hits the cache.
  const [user] = await Promise.all([
    findUserByTelegramId(base44, tid),
    prefetchStates(base44, [
      `lang:${tid}`,
      'setting:premium_hidden',
      'setting:stars_hidden',
      'setting:maintenance_mode',
      'setting:maintenance_message',
      `cmds:${chatId}`,
      `sell:${tid}`,
      `sellseason:${tid}`,
      `adminseason:${tid}`,
      `topup:${tid}`,
      `withdraw:${tid}`,
      `season:${tid}`,
      `buysearch:${tid}`,
      `buypage_query:${tid}`
    ])
  ]);
  const { lang, settings } = await getUserContext(base44, tid);
  if (settings.maintenance_mode && (!user || user.role !== 'admin')) {
    await tgSend(token, chatId, `${t(lang, 'maintenance.title')}\n\n${settings.maintenance_message || t(lang, 'maintenance.body')}`, replyTo);
    return;
  }
  // Each chat's "/" menu is set once: /start for everyone, plus admin uploads.
  // Fire-and-forget — the user's reply must never wait on this.
  if (!stateCache.get(`cmds:${chatId}`)) {
    const cmds = user && user.role === 'admin' ? [
      {
        command: 'start',
        description: '🚀 Start / Main menu'
      },
      {
        command: 'uploadsessions',
        description: '📤 Bulk upload sessions (admin)'
      },
      {
        command: 'adminseason',
        description: '📦 Admin season file upload (no reward)'
      }
    ] : [
      {
        command: 'start',
        description: '🚀 Start / Main menu'
      }
    ];
    waitUntil((async ()=>{
      await tgSetCommands(token, cmds, {
        type: 'chat',
        chat_id: chatId
      });
      await setState(base44, `cmds:${chatId}`, '1');
    })());
  }
  const rawText = text.trim();
  const isMenuPress = !!REPLY_MENU_ACTIONS[rawText];
  const cmd = isMenuPress ? REPLY_MENU_ACTIONS[rawText] : rawText.toLowerCase().split(/\s+/)[0].replace(/^\//, '');
  const ctx = {
    chatId,
    replyTo,
    text: isMenuPress ? '' : text,
    rawText,
    cmd,
    lang,
    settings,
    tgUser,
    user
  };
  const isPlainText = !rawText.startsWith('/') && !isMenuPress;
  if (isPlainText && await getState(base44, `buysearch:${tid}`)) {
    await handleBuySearch(base44, token, ctx);
    return;
  }
  if (isPlainText && /^\d+(\.\d+)?$/.test(rawText)) {
    if (await handleNumericFlows(base44, token, ctx)) return;
  }
  // Tapping a menu button cancels any pending guided flow.
  if (isMenuPress) {
    for (const key of [
      'sell',
      'sellseason',
      'adminseason',
      'topup',
      'withdraw',
      'season',
      'buysearch'
    ]){
      await clearState(base44, `${key}:${tid}`);
    }
  }
  if (isPlainText) {
    const sellStateRec = await getState(base44, `sell:${tid}`);
    if (sellStateRec && await handleSellFlow(base44, token, ctx, JSON.parse(sellStateRec.value))) return;
    if (user && await handleTextFlows(base44, token, ctx)) return;
  }
  await handleCommand(base44, token, ctx);
}
export default async function(req) {
  try {
    const base44 = makeB44(req);
    // Fresh cache per request so state is never stale across updates.
    stateCache.clear();
    const token = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!token) return Response.json({
      error: 'TELEGRAM_BOT_TOKEN not set'
    }, {
      status: 500
    });
    // Only /start is visible in the global "/" menu; admin chats get more.
    // Deferred so it never sits in front of the user's reply.
    const ensureDefaultCommands = async ()=>{
      try {
        if (!await getState(base44, 'default_commands_set')) {
          await tgSetCommands(token, [
            {
              command: 'start',
              description: '🚀 Start / Main menu'
            }
          ]);
          await setState(base44, 'default_commands_set', '1');
        }
      } catch (e) {
        console.error('set default commands failed', e.message);
      }
    };
    // Webhook mode: Telegram POSTs one update as the JSON body.
    let update = null;
    try {
      update = await req.json();
    } catch  {
      update = null;
    }
    if (update && update.update_id) {
      // Telegram re-sends an update if the webhook takes too long to answer
      // (code verification can run for a while). Claim the update_id once so a
      // retry is acknowledged instead of processed a second time.
      // One insert only — `key` is unique, so a retry fails here and exits.
      try {
        await base44.asServiceRole.entities.BotState.create({
          key: `upd:${update.update_id}`,
          value: String(Date.now())
        });
      } catch  {
        return Response.json({
          ok: true,
          duplicate: true
        });
      }
      try {
        await processUpdate(base44, token, update);
      } catch (err) {
        console.error('Webhook process error', err.message, err.stack);
        try {
          await tgSend(token, update.message?.chat?.id, `❌ Error: ${err.message}`);
        } catch  {}
      }
      waitUntil(ensureDefaultCommands());
      return Response.json({
        ok: true
      });
    }
    // Polling fallback (used when no webhook is registered).
    await ensureDefaultCommands();
    const offsetRec = await getState(base44, 'telegram_offset');
    const offset = offsetRec ? parseInt(offsetRec.value) : 0;
    const poll = ()=>fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30&limit=20`, {
        method: 'POST'
      });
    let updatesData = await (await poll()).json();
    // A webhook handles delivery when one is active. Never delete it from
    // here — a stray polling call must not knock the whole bot offline.
    if (!updatesData.ok && updatesData.error_code === 409) {
      return Response.json({
        ok: true,
        note: 'webhook active, polling skipped'
      });
    }
    if (!updatesData.ok) return Response.json({
      error: updatesData.description
    }, {
      status: 500
    });
    const updates = updatesData.result || [];
    let lastId = offset;
    for (const u of updates){
      try {
        await processUpdate(base44, token, u);
        if (u.update_id >= lastId) lastId = u.update_id + 1;
      } catch (err) {
        console.error('Error processing update', u.update_id, err.message);
      }
    }
    if (lastId > offset) await setState(base44, 'telegram_offset', String(lastId));
    return Response.json({
      ok: true,
      processed: updates.length,
      offset: lastId
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}