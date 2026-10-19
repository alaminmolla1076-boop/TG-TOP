import { runSql, sqlString } from '../_shared/webApi.ts';
import { resolveIdentity } from '../_shared/webIdentity.ts';

// Admin-only user actions: ban / unban, and balance add or set. Balance changes
// are recorded as approved top-ups (admin_credit / admin_debit) — the same
// source of truth commerce_balance sums — then the cached profiles.balance
// column is re-synced and the new balance returned.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || "");
    if (identity.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const action = String(body.action || "");
    if (!email) {
      return Response.json({ error: "email required" }, { status: 400 });
    }

    const currentBalance = async () => {
      const rows = await runSql(`select public.commerce_balance(${sqlString(email)}) as balance`);
      return Number(rows && rows[0] ? rows[0].balance : 0) || 0;
    };

    if (action === "ban" || action === "unban") {
      if (email === identity.identity_email) {
        return Response.json({ error: "You cannot ban yourself" }, { status: 400 });
      }
      const banned = action === "ban";
      await Promise.all([
        runSql(`update tg_web_users set banned = ${banned} where identity_email = ${sqlString(email)}`),
        runSql(`update profiles set banned = ${banned} where email = ${sqlString(email)}`),
      ]);
      return Response.json({ ok: true, banned });
    }

    if (action === "add_balance" || action === "set_balance") {
      let adjustment;
      if (action === "set_balance") {
        const target = Number(body.target_balance);
        if (!Number.isFinite(target) || target < 0) {
          return Response.json({ error: "Invalid target balance" }, { status: 400 });
        }
        adjustment = Math.round((target - (await currentBalance())) * 100) / 100;
      } else {
        adjustment = Number(body.amount);
        if (!Number.isFinite(adjustment) || adjustment === 0) {
          return Response.json({ error: "Invalid amount" }, { status: 400 });
        }
      }

      if (adjustment !== 0) {
        await runSql(
          `insert into top_ups (user_email, amount, coin, network, status)
           values (${sqlString(email)}, ${adjustment}, 'USDT',
                   ${sqlString(adjustment >= 0 ? "admin_credit" : "admin_debit")}, 'approved')`
        );
        await runSql(
          `update profiles set balance = public.commerce_balance(${sqlString(email)})
           where email = ${sqlString(email)}`
        );
      }
      return Response.json({ ok: true, balance: await currentBalance() });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}