import { runSql, sqlString } from '../_shared/webApi.ts';
import { resolveIdentity } from '../_shared/webIdentity.ts';

// The buyer's purchased accounts (tg_accounts they own with status 'sold'),
// with whether Supabase's purchaseAccount already captured a login code for
// each one (otp_requests) — shown on the Market page under the seller list.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');
    const email = sqlString(identity.identity_email);

    // Both queries run in parallel — the page waits only for the slowest.
    const [rows, batchRows] = await Promise.all([
      runSql(`
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
        and (a.purchase_type is null or a.purchase_type <> 'season')
      order by a.updated_date desc
      limit 20
    `),
      // Batch (session-format) purchases grouped per batch: one history row per
      // ZIP, with the account count and batch_id for chat redelivery.
      runSql(`
      select a.batch_id, max(a.country_iso) as country_iso, count(*) as account_count,
             max(a.updated_date) as purchased_at,
             coalesce(max(r.country_name), max(c.name), max(a.country_iso)) as country_name,
             coalesce(max(r.flag), max(c.flag), '') as flag
      from tg_accounts a
      left join reward_prices r on r.country_iso = a.country_iso and r.active = true
      left join countries c on c.iso = a.country_iso
      where a.owner_email = ${email} and a.status = 'sold'
        and a.purchase_type = 'season' and a.batch_id is not null
      group by a.batch_id
      order by purchased_at desc
      limit 10
    `)
    ]);

    return Response.json({
      batches: batchRows.map((b) => ({
        batch_id: b.batch_id,
        country_iso: b.country_iso,
        country_name: b.country_name,
        flag: b.flag,
        account_count: b.account_count,
        purchased_at: b.purchased_at,
      })),
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