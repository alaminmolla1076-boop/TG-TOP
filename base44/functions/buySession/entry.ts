import { secrets } from "base44:runtime";
import { runSql, sqlString, callB44 } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Sends a message from the app's Telegram bot to a user's chat.
async function sendBotMessage(chatId, text) {
  const token = secrets.get("TELEGRAM_BOT_TOKEN");
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Telegram delivery failed (${res.status})`);
}

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.initData) {
      return Response.json({ error: 'Open the app from Telegram to buy sessions' }, { status: 400 });
    }
    const countryIso = String(body.country_iso || '').trim().toUpperCase();
    const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));
    if (!countryIso) return Response.json({ error: 'Missing country_iso' }, { status: 400 });

    // When buying from a specific seller (market seller list), pass the seller
    // through — Supabase's purchaseAccount claims that seller's accounts.
    const sellerEmail = String(body.seller_email || '').trim();
    const res = await callB44('purchaseAccount', {
      initData: body.initData,
      country_iso: countryIso,
      quantity,
      ...(sellerEmail ? { seller_email: sellerEmail, owner_email: sellerEmail } : {}),
    });

    const accounts = Array.isArray(res.accounts)
      ? res.accounts
      : Array.isArray(res.account_ids)
        ? res.account_ids.map((id) => ({ id }))
        : [];

    // Deliver the purchased accounts to the buyer's Telegram chat in session
    // format — the session strings live in Supabase (tg_accounts.session_string).
    let delivered = 0;
    let delivery_error = null;
    try {
      const identity = await resolveIdentity(body.initData);
      const chatId = identity.telegram_id;

      let withSessions = accounts.filter((a) => a && a.session_string);
      if (withSessions.length < accounts.length) {
        const ids = accounts.map((a) => a && a.id).filter(Boolean);
        if (ids.length) {
          const rows = await runSql(
            `select id, phone_number, country_iso, session_string
             from tg_accounts where id in (${ids.map((id) => sqlString(String(id))).join(',')})`
          );
          withSessions = accounts.map((a) => {
            const row = rows.find((r) => r.id === a.id);
            return row ? { ...a, ...row } : a;
          });
        }
      }

      for (const a of withSessions) {
        if (!a.session_string) continue;
        const text =
          'Your purchased Telegram account:\n\n' +
          (a.phone_number ? `Phone: ${a.phone_number}\n` : '') +
          (a.country_iso ? `Country: ${a.country_iso}\n` : '') +
          '\nSession string:\n' +
          a.session_string;
        await sendBotMessage(chatId, text);
        delivered++;
      }
    } catch (err) {
      delivery_error = err.message;
    }

    let balance = res.balance;
    if (balance === undefined || balance === null) {
      balance = (await callB44('getBalance', { initData: body.initData })).balance;
    }
    return Response.json({ accounts, delivered, delivery_error, balance: Number(balance) || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}