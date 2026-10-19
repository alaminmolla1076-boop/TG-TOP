import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Admin-only: a single user's purchase / sale / top-up / withdrawal history.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || "");
    if (identity.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    const rawEmail = String(body.email || "").trim().toLowerCase();
    if (!rawEmail) {
      return Response.json({ error: "email required" }, { status: 400 });
    }
    const email = sqlString(rawEmail);

    const [purchases, sales, topups, withdrawals] = await Promise.all([
      runSql(
        `select id, product_name, price, status, created_date
         from product_orders where user_email = ${email}
         order by created_date desc limit 50`
      ),
      runSql(
        `select id, country_iso, phone_number, reward_amount, status, created_date
         from session_requests where user_email = ${email}
         order by created_date desc limit 50`
      ),
      runSql(
        `select id, amount, network, status, created_date
         from top_ups where user_email = ${email} and network <> 'purchase_commission'
         order by created_date desc limit 50`
      ),
      runSql(
        `select id, amount, network, wallet_address, status, created_date
         from withdrawals where user_email = ${email}
         order by created_date desc limit 50`
      ),
    ]);

    return Response.json({
      purchases: purchases.map((o) => ({ ...o, price: Number(o.price) })),
      sales,
      topups: topups.map((x) => ({ ...x, amount: Number(x.amount) })),
      withdrawals: withdrawals.map((w) => ({ ...w, amount: Number(w.amount) })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}