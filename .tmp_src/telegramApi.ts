// Shared Telegram Bot API helpers — verbatim port of base44/shared/telegramApi.ts.
// No Base44 dependencies, so the logic is unchanged.
export const TG_API = (token, method)=>`https://api.telegram.org/bot${token}/${method}`;
export async function tgCall(token, method, body) {
  const r = await fetch(TG_API(token, method), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body || {})
  });
  return r.json();
}
// Telegram rejects messages longer than 4096 chars — long lists (e.g. the
// reward-price table) silently failed. Split on line breaks and send in parts.
function splitLongText(text) {
  const MAX = 3800;
  const str = String(text || '');
  if (str.length <= MAX) return [
    str
  ];
  const parts = [];
  let cur = '';
  for (const line of str.split('\n')){
    if ((cur + line + '\n').length > MAX) {
      if (cur) parts.push(cur);
      cur = '';
      // A single line longer than MAX gets hard-split.
      let rest = line;
      while(rest.length > MAX){
        parts.push(rest.slice(0, MAX));
        rest = rest.slice(MAX);
      }
      cur = rest + '\n';
    } else {
      cur += line + '\n';
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}
export async function tgSend(token, chatId, text, replyTo) {
  const chunks = splitLongText(text);
  if (chunks.length > 1) {
    let last;
    for (const chunk of chunks){
      last = await tgSendOne(token, chatId, chunk, replyTo);
      replyTo = undefined;
    }
    return last;
  }
  return tgSendOne(token, chatId, chunks[0], replyTo);
}
async function tgSendOne(token, chatId, text, replyTo) {
  try {
    const r = await tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_to_message_id: replyTo || undefined,
      disable_web_page_preview: true
    });
    if (!r.ok && r.description && /message to be replied not found/i.test(r.description)) {
      return tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
    }
    return r;
  } catch (e) {
    return tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
  }
}
export async function tgDeleteMessage(token, chatId, messageId) {
  if (!messageId) return;
  try {
    await tgCall(token, 'deleteMessage', {
      chat_id: chatId,
      message_id: messageId
    });
  } catch  {}
}
export async function tgSendDoc(token, chatId, fileUrl, caption) {
  return tgCall(token, 'sendDocument', {
    chat_id: chatId,
    document: fileUrl,
    caption: caption || undefined
  });
}
export async function tgSendMenu(token, chatId, text, keyboard, replyTo) {
  try {
    const r = await tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_to_message_id: replyTo || undefined,
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    if (!r.ok && r.description && /message to be replied not found/i.test(r.description)) {
      return tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    }
    return r;
  } catch (e) {
    return tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }
}
export async function tgAnswerCallback(token, callbackId, text) {
  return tgCall(token, 'answerCallbackQuery', {
    callback_query_id: callbackId,
    text: text || undefined
  });
}
export async function tgEditMenu(token, chatId, messageId, text, keyboard) {
  return tgCall(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}
export async function tgSetCommands(token, commands, scope) {
  const body = {
    commands
  };
  if (scope) body.scope = scope;
  return tgCall(token, 'setMyCommands', body);
}
// Build a session delivery message for the bot chat.
// Only the session string is delivered — no API ID/Hash, no 2FA password.
// 2FA is already disabled at purchase time by purchaseAccount.
export function formatSessionMessage(account) {
  return [
    `🔑 <b>Session</b>`,
    ``,
    `<code>${account.session_string || ''}</code>`
  ].join('\n');
}
// Download a file sent by a user. Returns the file content as a string.
// Works for .txt, .json, and other text-based files.
export async function tgDownloadFile(token, fileId) {
  const fileRes = await tgCall(token, 'getFile', {
    file_id: fileId
  });
  if (!fileRes.ok) throw new Error(fileRes.description || 'getFile failed');
  const filePath = fileRes.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return await res.text();
}
// Download a file as raw bytes. Use for ZIP, .session (SQLite), and other
// binary files where UTF-8 text decoding would corrupt the data.
export async function tgDownloadFileBytes(token, fileId) {
  const fileRes = await tgCall(token, 'getFile', {
    file_id: fileId
  });
  if (!fileRes.ok) throw new Error(fileRes.description || 'getFile failed');
  const filePath = fileRes.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}
export async function tgSendReplyKeyboard(token, chatId, text, keyboard, replyTo) {
  try {
    const r = await tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_to_message_id: replyTo || undefined,
      disable_web_page_preview: true,
      reply_markup: keyboard
    });
    if (!r.ok && r.description && /message to be replied not found/i.test(r.description)) {
      return tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: keyboard
      });
    }
    return r;
  } catch (e) {
    return tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: keyboard
    });
  }
}
