import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Get Code: returns the login code Supabase's purchaseAccount captured for a
// single-account purchase (otp_requests), scoped to the buying user only.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');
    const email = sqlString(identity.identity_email);
    const rawId = String(body.account_id || '').trim();
    if (!rawId) return Response.json({ error: 'Missing account_id' }, { status: 400 });

    const rows = await runSql(`
      select o.otp_code, o.phone_number, o.country_iso, o.status, o.created_date
      from otp_requests o
      join tg_accounts a on a.id = o.account_id
      where o.account_id = ${sqlString(rawId)}
        and o.user_email = ${email}
        and a.owner_email = ${email}
        and a.status = 'sold'
      order by o.created_date desc
      limit 1
    `);

    if (!rows.length) {
      return Response.json(
        { error: 'No login code captured for this account yet — try again shortly' },
        { status: 404 }
      );
    }
    const row = rows[0];
    return Response.json({
      code: row.otp_code,
      phone_number: row.phone_number,
      status: row.status,
      created_date: row.created_date,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}