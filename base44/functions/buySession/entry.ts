import { runSql, sqlString, callB44 } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Buys accounts from a seller's stock. Supabase's purchaseAccount owns the
// whole flow: it claims the accounts, charges the balance and delivers to the
// buyer's Telegram chat — the login number with its captured login code
// (otp_requests) for a single purchase, session formats for a batch. This
// proxy only validates the request and returns the bought account stubs.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.initData) {
      return Response.json({ error: 'Open the app from Telegram to buy sessions' }, { status: 400 });
    }
    const countryIso = String(body.country_iso || '').trim().toUpperCase();
    const qty = body.quantity == null ? 1 : Number(body.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 3000) {
      return Response.json({ error: 'Quantity must be a whole number between 1 and 3000' }, { status: 400 });
    }
    if (!countryIso) return Response.json({ error: 'Missing country_iso' }, { status: 400 });

    // When buying from a specific seller (market seller list), pass the seller
    // through — Supabase's purchaseAccount claims that seller's accounts.
    const sellerEmail = String(body.seller_email || '').trim();
    // Spam / Non-Spam stock pool chosen on the seller's page.
    const spamPool = String(body.spam_pool || '').trim().toLowerCase();
    const pool = ['spam', 'nonspam'].includes(spamPool) ? spamPool : '';
    // Your own listings are visible to you on the market but can't be bought.
    if (sellerEmail) {
      const identity = await resolveIdentity(body.initData);
      if ((identity.identity_email || '').toLowerCase() === sellerEmail.toLowerCase()) {
        return Response.json({ error: 'You cannot buy your own listings' }, { status: 400 });
      }
    }
    const res = await callB44('purchaseAccount', {
      initData: body.initData,
      country_iso: countryIso,
      quantity: qty,
      // Batch purchases are delivered as session-format files (a ZIP in the
      // buyer's Telegram chat); a single purchase returns just the phone.
      ...(qty > 1 ? { mode: 'session' } : {}),
      ...(sellerEmail ? { seller_email: sellerEmail, owner_email: sellerEmail } : {}),
      ...(pool ? { spam_pool: pool } : {}),
    }, 110000);

    const ids = (Array.isArray(res.accounts)
      ? res.accounts.map((a) => a && a.id)
      : Array.isArray(res.account_ids)
        ? res.account_ids
        : []
    ).filter(Boolean);

    let accounts = [];
    if (ids.length) {
      const rows = await runSql(
        `select id, phone_number, country_iso, purchase_type
         from tg_accounts where id in (${ids.map((id) => sqlString(String(id))).join(',')})`
      );
      accounts = rows;
    }

    let balance = res.balance;
    if (balance === undefined || balance === null) {
      balance = (await callB44('getBalance', { initData: body.initData })).balance;
    }
    return Response.json({ accounts, count: accounts.length, balance: Number(balance) || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}