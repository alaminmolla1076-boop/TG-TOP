import { runSql } from './webApi.ts';

// One age-aware inventory query shared by the Mini App and Telegram Market.
export async function getAgeStockRows() {
  return runSql(`select a.owner_email, a.country_iso,
    coalesce(a.age_category, 'regular') as age_category,
    count(*) filter (where a.spam is true) as spam_stock,
    count(*) filter (where a.spam is false) as nonspam_stock,
    min(coalesce(p.price, a.price)) filter (where a.spam is true) as spam_price,
    min(coalesce(p.price, a.price)) filter (where a.spam is false) as nonspam_price,
    min(coalesce(p.price, a.price)) as price
    from tg_accounts a
    left join stock_prices p on p.owner_email = a.owner_email
      and p.country_iso = a.country_iso and p.spam = a.spam
      and p.age_category = coalesce(a.age_category, 'regular')
    where a.status = 'available' and coalesce(p.price, a.price) is not null
    group by a.owner_email, a.country_iso, coalesce(a.age_category, 'regular')
    order by a.owner_email, a.country_iso, age_category`);
}

export function attachAgeStock(sellers, rows) {
  const byOwner = new Map(sellers.map((seller) => [seller.email, seller]));
  const groups = new Map();
  for (const seller of sellers) {
    seller.age_groups = [];
    for (const country of seller.countries) country.ages = [];
    groups.set(seller.email, new Map());
  }
  for (const row of rows) {
    const seller = byOwner.get(row.owner_email);
    const country = seller?.countries.find((item) => item.country_iso === row.country_iso);
    if (!country) continue;
    const age = {
      category: row.age_category,
      spam_stock: Number(row.spam_stock || 0),
      nonspam_stock: Number(row.nonspam_stock || 0),
      spam_price: row.spam_price == null ? null : Number(row.spam_price),
      nonspam_price: row.nonspam_price == null ? null : Number(row.nonspam_price),
      price: Number(row.price),
    };
    country.ages.push(age);
    const sellerGroups = groups.get(seller.email);
    if (!sellerGroups.has(age.category)) {
      const group = { category: age.category, spam_stock: 0, nonspam_stock: 0, countries: [] };
      sellerGroups.set(age.category, group);
      seller.age_groups.push(group);
    }
    const group = sellerGroups.get(age.category);
    group.spam_stock += age.spam_stock;
    group.nonspam_stock += age.nonspam_stock;
    group.countries.push({ ...country, stock: age.spam_stock + age.nonspam_stock,
      spam_stock: age.spam_stock, nonspam_stock: age.nonspam_stock,
      price: age.price, ages: [age] });
  }
  return sellers;
}