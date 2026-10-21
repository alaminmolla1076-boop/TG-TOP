import { admin } from './entities.ts';

// Never inherit another age's price, even within the same country and pool.
export async function sellerAgePrice(owner, country, spam, age, fallback = 0) {
  const { data, error } = await admin.from('stock_prices').select('price')
    .eq('owner_email', owner).eq('country_iso', country)
    .eq('spam', spam).eq('age_category', age).maybeSingle();
  if (error) throw new Error(error.message);
  return data && Number(data.price) > 0 ? Number(data.price) : Number(fallback || 0);
}