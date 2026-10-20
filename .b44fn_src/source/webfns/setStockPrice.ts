import { callB44, runSql } from '../_shared/webApi.ts';
import { isValidAgeCategory } from '../_shared/accountAge.js';

// Lets a seller set the sale price for all of their available numbers of one
// country in ONE stock pool (spam: true / false). Delegated to the
// Supabase-side updateSellerPrice (b44fn) — the single implementation for
// stock prices. The pool price is remembered in stock_prices for the daily
// spam sweep, and when the new price is LOWER than the old one,
// updateSellerPrice also broadcasts a localized price-drop notice
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
    const spam = !!body.spam;
    // Optional age bucket ('' = the whole pool). One price per
    // seller + country + pool + age.
    const ageCategory = String(body.age_category || '').trim();
    if (ageCategory && !isValidAgeCategory(ageCategory)) {
      return Response.json({ error: "Invalid account age" }, { status: 400 });
    }

    // Idempotent bootstrap — pool prices the daily @SpamBot sweep reads when an
    // account moves from the Spam pool into the Non-Spam pool.
    await runSql(
      `create table if not exists stock_prices (
        owner_email text not null,
        country_iso text not null,
        spam boolean not null default false,
        age_category text not null default '',
        price numeric not null,
        updated_date timestamptz not null default now(),
        primary key (owner_email, country_iso, spam, age_category)
      )`
    );

    const res = await callB44("updateSellerPrice", {
      init_data: body.initData,
      country_iso: iso,
      price,
      spam,
      ...(ageCategory ? { age_category: ageCategory } : {})
    });
    return Response.json(res);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}