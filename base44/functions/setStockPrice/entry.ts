import { callB44 } from "../../shared/supabase.ts";

// Lets a seller set the sale price for all of their available numbers of one
// country. Delegated to the Supabase-side updateSellerPrice (b44fn) — the
// single implementation for stock prices. When the new price is LOWER than the
// old one, that handler also broadcasts a localized price-drop notice
// (seller username, country + flag, Spam / Non-Spam pool, old → new price)
// to every user's bot chat.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const iso = String(body.country_iso || "").trim().toUpperCase();
    const price = Number(body.price);
    if (!iso) {
      return Response.json({ error: "Missing country" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0 || price > 100000) {
      return Response.json({ error: "Enter a valid price greater than 0" }, { status: 400 });
    }

    const res = await callB44("updateSellerPrice", {
      init_data: body.initData,
      country_iso: iso,
      price
    });
    return Response.json(res);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}