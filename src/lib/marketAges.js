// Market age filter — derived views over the seller catalog the Market page
// already loads (sellers → countries → per-age stock/price for both pools).
import { AGE_OPTIONS } from "@/lib/accountAge";

const ageOrder = (v) => {
  const i = AGE_OPTIONS.findIndex((o) => o.value === String(v));
  return i < 0 ? AGE_OPTIONS.length : i;
};

// One offer = one seller selling one country's stock in one pool at one age.
function poolOffers(sellers, category) {
  const offers = [];
  for (const s of sellers || []) {
    for (const c of s.countries || []) {
      for (const a of c.ages || []) {
        if (String(a.category) !== String(category)) continue;
        const pools = [
          { pool: "nonspam", stock: a.nonspam_stock, price: a.nonspam_price ?? a.price },
          { pool: "spam", stock: a.spam_stock, price: a.spam_price ?? a.price },
        ];
        for (const p of pools) {
          if (Number(p.stock) > 0 && p.price != null) {
            offers.push({
              seller: s,
              country: c,
              pool: p.pool,
              stock: Number(p.stock),
              price: Number(p.price),
            });
          }
        }
      }
    }
  }
  return offers;
}

// Age buttons data: every bucket with stock across the whole marketplace,
// youngest first, with its total stock count. Pass a pool ("spam"/"nonspam")
// to count only that pool's stock — the seller page does that per pool tab.
export function ageStockTotals(sellers, pool) {
  const totals = new Map();
  for (const s of sellers || []) {
    for (const c of s.countries || []) {
      for (const a of c.ages || []) {
        const n =
          pool === "spam"
            ? Number(a.spam_stock || 0)
            : pool === "nonspam"
              ? Number(a.nonspam_stock || 0)
              : Number(a.spam_stock || 0) + Number(a.nonspam_stock || 0);
        if (n <= 0) continue;
        const k = String(a.category);
        totals.set(k, (totals.get(k) || 0) + n);
      }
    }
  }
  return [...totals.entries()]
    .map(([category, stock]) => ({ category, stock }))
    .sort((x, y) => ageOrder(x.category) - ageOrder(y.category));
}

// Country catalog for one age bucket: countries that hold stock in that age,
// cheapest first, each with its total stock, best price and per-seller offers.
export function ageCountryCatalog(sellers, category) {
  const map = new Map();
  for (const o of poolOffers(sellers, category)) {
    const k = o.country.country_iso;
    if (!map.has(k)) {
      map.set(k, {
        country_iso: k,
        country_name: o.country.country_name,
        flag: o.country.flag,
        dial_code: o.country.dial_code,
        total: 0,
        fromPrice: Infinity,
        offers: [],
      });
    }
    const e = map.get(k);
    e.total += o.stock;
    e.fromPrice = Math.min(e.fromPrice, o.price);
    e.offers.push(o);
  }
  const list = [...map.values()];
  for (const e of list) e.offers.sort((a, b) => a.price - b.price);
  return list.sort((a, b) => a.fromPrice - b.fromPrice);
}