import { callB44 } from "../../shared/supabase.ts";

// Buys Telegram account sessions through the existing Supabase b44fn function
// (purchaseAccount), which verifies the Telegram signature, charges the balance
// and claims available accounts for the buyer. Requires a real Telegram user.
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
    let balance = res.balance;
    if (balance === undefined || balance === null) {
      balance = (await callB44('getBalance', { initData: body.initData })).balance;
    }
    return Response.json({ accounts, balance: Number(balance) || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}