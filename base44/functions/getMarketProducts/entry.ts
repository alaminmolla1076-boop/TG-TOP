import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');
    const profile = identity.profile;
    const [products, accountCountries] = await Promise.all([
      runSql(
        `select id, name, description, price, category, icon, unit_label
         from products where active = true
         order by sort_order asc nulls last, created_date asc limit 100`
      ),
      runSql(
        `select a.country_iso,
                coalesce(r.country_name, c.name, a.country_iso) as country_name,
                coalesce(r.flag, c.flag, '') as flag,
                min(a.price) as price,
                count(*) as stock
         from tg_accounts a
         left join reward_prices r on r.country_iso = a.country_iso and r.active = true
         left join countries c on c.iso = a.country_iso
         where a.status = 'available'
           and a.price is not null
           and a.owner_email <> ${sqlString(identity.identity_email)}
         group by a.country_iso, r.country_name, c.name, r.flag, c.flag
         order by country_name asc limit 100`
      ),
    ]);

    return Response.json({
      balance: profile ? Number(profile.balance) : 0,
      products: products.map((p) => ({ ...p, price: Number(p.price) })),
      account_countries: accountCountries.map((c) => ({ ...c, price: Number(c.price), stock: Number(c.stock) })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}