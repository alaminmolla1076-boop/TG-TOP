import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');

    const email = sqlString(identity.identity_email);
    const profile = identity.profile;
    const isAdmin = identity.role === 'admin';

    // All queries, the balance recompute and the admin queues run in parallel —
    // none of them depends on another, so the page waits only for the slowest.
    const [topUps, orders, accountSales, countries, withdrawals, balanceRes, pendingDeposits, pendingWithdrawals, myStock] = await Promise.all([
      runSql(
        `select id, amount, network, tx_hash, status, created_date
         from top_ups where user_email = ${email} and network <> 'purchase_commission'
         order by created_date desc limit 20`
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
      runSql(
        `select id, amount, coin, network, wallet_address, status, created_date
         from withdrawals where user_email = ${email} order by created_date desc limit 20`
      ),
      // Balance computed from the same source-of-truth SQL function the
      // Supabase getBalance uses (commerce_balance) — one query in parallel
      // instead of a slow edge-function roundtrip.
      runSql(`select public.commerce_balance(${email}) as balance`).catch(() => null),
      isAdmin
        ? runSql(
            `select id, amount, network, tx_hash, status, user_email, created_date
             from top_ups where status = 'pending' order by created_date desc limit 50`
          )
        : Promise.resolve([]),
      isAdmin
        ? runSql(
            `select id, amount, coin, network, wallet_address, status, user_email, created_date
             from withdrawals where status not in ('approved', 'rejected')
             order by created_date desc limit 50`
          )
        : Promise.resolve([]),
        // The seller's own available numbers, grouped by country with the
        // price they set — edited from the Sell page (setStockPrice).
        runSql(
        `select a.country_iso,
              coalesce(r.country_name, c.name, a.country_iso) as country_name,
              coalesce(r.flag, c.flag, '') as flag,
              count(*) as stock,
              min(a.price) as price
        from tg_accounts a
        left join reward_prices r on r.country_iso = a.country_iso and r.active = true
        left join countries c on c.iso = a.country_iso
        where a.owner_email = ${email} and a.status = 'available'
        group by a.country_iso, r.country_name, c.name, r.flag, c.flag
        order by country_name asc limit 100`
        ),
        ]);

    let balance = profile ? Number(profile.balance) : 0;
    const recomputed = balanceRes && balanceRes[0] ? balanceRes[0].balance : undefined;
    if (recomputed !== undefined && Number.isFinite(Number(recomputed))) {
      balance = Number(recomputed);
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
      my_stock: myStock.map((s) => ({
        country_iso: s.country_iso,
        country_name: s.country_name,
        flag: s.flag,
        stock: Number(s.stock),
        price: s.price === null || s.price === undefined ? null : Number(s.price),
      })),
      countries: countries.map((c) => ({ ...c, reward_price: Number(c.reward_price) })),
      pending_deposits: pendingDeposits,
      withdrawals: withdrawals.map((w) => ({ ...w, amount: Number(w.amount) })),
      pending_withdrawals: pendingWithdrawals.map((w) => ({ ...w, amount: Number(w.amount) })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}