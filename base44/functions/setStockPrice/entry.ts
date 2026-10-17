import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Lets a seller set the sale price for all of their available numbers of one
// country (tg_accounts.price in the existing Supabase system). The market
// shows the stock at this price and buyers pay it when purchasing.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || "");
    const iso = String(body.country_iso || "").trim().toUpperCase();
    const price = Number(body.price);
    if (!iso) {
      return Response.json({ error: "Missing country" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0 || price > 100000) {
      return Response.json({ error: "Enter a valid price greater than 0" }, { status: 400 });
    }

    const email = sqlString(identity.identity_email);
    await runSql(
      `update tg_accounts set price = ${sqlString(price)}, updated_date = now()
       where owner_email = ${email} and country_iso = ${sqlString(iso)} and status = 'available'`
    );
    const rows = await runSql(
      `select count(*) as cnt from tg_accounts
       where owner_email = ${email} and country_iso = ${sqlString(iso)} and status = 'available'`
    );
    return Response.json({ country_iso: iso, price, updated: Number(rows[0]?.cnt || 0) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}