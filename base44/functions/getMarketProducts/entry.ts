import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');
    const profile = identity.profile;
    const email = sqlString(identity.identity_email);

    const [products, sellerRows] = await Promise.all([
      // Telegram Premium and Stars purchases are hidden from the market.
      runSql(
        `select id, name, description, price, category, icon, unit_label
         from products
         where active = true and coalesce(category, '') not in ('premium', 'stars')
         order by sort_order asc nulls last, created_date asc limit 100`
      ),
      // Sellers (tg_accounts owners) with the countries they sell, the price
      // they set and their stock — the market shows this as a seller list.
      runSql(
        `select a.owner_email,
                p.id as seller_id,
                coalesce(p.full_name, p.telegram_first_name, 'Seller') as name,
                coalesce(p.telegram_username, '') as username,
                p.telegram_id,
                p.telegram_photo_url as photo_url,
                a.country_iso,
                coalesce(r.country_name, c.name, a.country_iso) as country_name,
                coalesce(r.flag, c.flag, '') as flag,
                min(a.price) as price,
                count(*) as stock
         from tg_accounts a
         join profiles p on p.email = a.owner_email
         left join reward_prices r on r.country_iso = a.country_iso and r.active = true
         left join countries c on c.iso = a.country_iso
         where a.status = 'available'
           and a.price is not null
           and a.owner_email <> ${email}
         group by a.owner_email, p.id, p.full_name, p.telegram_first_name, p.telegram_username,
                  p.telegram_id, p.telegram_photo_url, a.country_iso, r.country_name, c.name, r.flag
         order by name asc, country_name asc limit 500`
      ),
    ]);

    const sellersMap = new Map();
    for (const row of sellerRows) {
      if (!sellersMap.has(row.seller_id)) {
        sellersMap.set(row.seller_id, {
          id: row.seller_id,
          email: row.owner_email,
          name: row.name,
          username: row.username,
          telegram_id: row.telegram_id,
          photo_url: row.photo_url,
          countries: [],
        });
      }
      sellersMap.get(row.seller_id).countries.push({
        country_iso: row.country_iso,
        country_name: row.country_name,
        flag: row.flag,
        price: Number(row.price),
        stock: Number(row.stock),
      });
    }

    return Response.json({
      balance: profile ? Number(profile.balance) : 0,
      products: products.map((p) => ({ ...p, price: Number(p.price) })),
      sellers: Array.from(sellersMap.values()),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}