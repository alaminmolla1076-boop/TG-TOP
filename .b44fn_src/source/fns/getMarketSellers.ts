import { makeB44 } from '../_shared/b44.ts';
import { admin } from '../_shared/entities.ts';
import { resolveUser } from '../_shared/resolveUser.ts';

// The bot's Market data: the same sellers/country stock the app's Market page
// shows (getMarketProducts), served by one SQL function (get_market_sellers)
// so both surfaces always agree on sellers, prices and stock.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json().catch(()=>({}));
    // Optional seller search (username or name, case-insensitive).
    const query = String(body.query || '').trim().replace(/^@+/, '').toLowerCase();
    const user = await resolveUser(base44, body);
    if (!user?.email) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const { data, error } = await admin.rpc('get_market_sellers', {
      p_email: user.email
    });
    if (error) throw new Error(error.message);
    const payload = typeof data === 'string' ? JSON.parse(data) : data || {
    };
    const sellersMap = new Map();
    for (const row of payload.rows || []){
      if (!sellersMap.has(row.owner_email)) {
        sellersMap.set(row.owner_email, {
          email: row.owner_email,
          name: row.name,
          username: row.username,
          is_self: row.is_self === true,
          sold: Number(row.sold || 0),
          countries: []
        });
      }
      sellersMap.get(row.owner_email).countries.push({
        country_iso: row.country_iso,
        country_name: row.country_name,
        flag: row.flag,
        dial_code: row.dial_code,
        price: Number(row.price),
        stock: Number(row.stock),
        spam_stock: Number(row.spam_stock),
        nonspam_stock: Number(row.nonspam_stock)
      });
    }
    let sellers = Array.from(sellersMap.values());
    if (query) sellers = sellers.filter((s)=>(s.username || '').toLowerCase().includes(query) || (s.name || '').toLowerCase().includes(query));
    return Response.json({
      sellers,
      top_seller: payload.top_seller && payload.top_seller.name ? payload.top_seller : null,
      products: (payload.products || []).map((p)=>({
          ...p,
          price: Number(p.price)
        }))
    });
  } catch (err) {
    return Response.json({
      error: err.message
    }, {
      status: 500
    });
  }
}