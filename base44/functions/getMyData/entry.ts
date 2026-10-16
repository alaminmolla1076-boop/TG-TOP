import { runSql, sqlString, callB44 } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');

    const email = sqlString(identity.identity_email);
    const profile = identity.profile;
    const isAdmin = identity.role === 'admin';

    const [topUps, orders, accountSales, countries] = await Promise.all([
      runSql(
        `select id, amount, network, tx_hash, status, created_date
         from top_ups where user_email = ${email} order by created_date desc limit 20`
      ),
      runSql(
        `select id, product_name, price, category, status, created_date
         from product_orders where user_email = ${email} order by created_date desc limit 20`
      ),
      runSql(
        `select id, country_iso, phone_number, status, reward_status, reward_amount, reward_eligible_at, created_date
         from session_requests where user_email = ${email} order by created_date desc limit 20`
      ),
      runSql(
        `select country_iso, country_name, flag, reward_price, reward_wait_hours
         from reward_prices where active = true order by country_name asc limit 100`
      ),
    ]);

    let pendingDeposits = [];
    if (isAdmin) {
      pendingDeposits = await runSql(
        `select id, amount, network, tx_hash, status, user_email, created_date
         from top_ups where status = 'pending' order by created_date desc limit 50`
      );
    }

    // Balance from the existing Supabase function when signed in — it recomputes
    // it from the source-of-truth records and keeps the profile in sync.
    let balance = profile ? Number(profile.balance) : 0;
    try {
      balance = Number((await callB44('getBalance', { initData: body.initData })).balance) || balance;
    } catch (e) {
      /* fall back to the stored profile balance */
    }

    return Response.json({
      role: identity.role,
      balance,
      deposits: topUps.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        network: d.network,
        txid: d.tx_hash,
        status: d.status,
        created_date: d.created_date,
      })),
      orders: orders.map((o) => ({ ...o, price: Number(o.price) })),
      account_sales: accountSales,
      countries: countries.map((c) => ({ ...c, reward_price: Number(c.reward_price) })),
      pending_deposits: pendingDeposits,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}