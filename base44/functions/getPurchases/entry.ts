import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// The buyer's purchased accounts (tg_accounts they own with status 'sold'),
// with whether Supabase's purchaseAccount already captured a login code for
// each one (otp_requests) — shown on the Market page under the seller list.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');
    const email = sqlString(identity.identity_email);

    const rows = await runSql(`
      select a.id, a.phone_number, a.country_iso, a.purchase_type, a.updated_date,
             coalesce(r.country_name, c.name, a.country_iso) as country_name,
             coalesce(r.flag, c.flag, '') as flag,
             o.status as otp_status,
             o.has_code
      from tg_accounts a
      left join reward_prices r on r.country_iso = a.country_iso and r.active = true
      left join countries c on c.iso = a.country_iso
      left join (
        select distinct on (account_id) account_id, status, (otp_code is not null) as has_code
        from otp_requests
        where user_email = ${email}
        order by account_id, created_date desc
      ) o on o.account_id = a.id
      where a.owner_email = ${email} and a.status = 'sold'
      order by a.updated_date desc
      limit 20
    `);

    return Response.json({
      purchases: rows.map((p) => ({
        id: p.id,
        phone_number: p.phone_number,
        country_iso: p.country_iso,
        country_name: p.country_name,
        flag: p.flag,
        purchase_type: p.purchase_type,
        otp_status: p.otp_status,
        has_code: !!p.has_code,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}