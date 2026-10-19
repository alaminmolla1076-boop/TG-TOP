import { callB44 } from '../_shared/webApi.ts';

// Purchases a product through the existing Supabase b44fn function
// (purchaseProduct), which verifies the Telegram signature, charges the
// balance and records the order. Requires a real Telegram user.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const productId = String(body.product_id || '');
    if (!productId) return Response.json({ error: 'Missing product_id' }, { status: 400 });
    if (!body.initData) {
      return Response.json({ error: 'Open the app from Telegram to buy products' }, { status: 400 });
    }

    const res = await callB44('purchaseProduct', { initData: body.initData, product_id: productId });
    const order = res.order || {
      id: res.order_id || '',
      product_name: res.product_name || '',
      price: Number(res.price) || 0,
    };
    let balance = res.balance;
    if (balance === undefined || balance === null) {
      balance = (await callB44('getBalance', { initData: body.initData })).balance;
    }
    return Response.json({ order, balance: Number(balance) || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}