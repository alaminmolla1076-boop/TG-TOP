import { runSql } from "../../shared/supabase.ts";
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
        `select iso as country_iso, name as country_name, flag, price, stock
         from countries where active = true and stock > 0
         order by name asc limit 100`
      ),
    ]);

    return Response.json({
      balance: profile ? Number(profile.balance) : 0,
      products: products.map((p) => ({ ...p, price: Number(p.price) })),
      account_countries: accountCountries.map((c) => ({ ...c, price: Number(c.price) })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}