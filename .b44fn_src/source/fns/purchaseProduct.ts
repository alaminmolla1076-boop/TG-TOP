import { makeB44 } from '../_shared/b44.ts';
import { getRealBalance, syncUserBalance } from '../_shared/balance.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json().catch(()=>({}));
    const user = await resolveUser(base44, body);
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const { product_id } = body;
    const product = await base44.asServiceRole.entities.Product.get(product_id);
    if (!product) return Response.json({
      error: 'Product not found'
    }, {
      status: 404
    });
    if (product.active === false) return Response.json({
      error: 'Product unavailable'
    }, {
      status: 400
    });
    const realBalance = await getRealBalance(base44, user.email);
    if (realBalance < product.price) {
      return Response.json({
        error: 'Insufficient balance'
      }, {
        status: 400
      });
    }
    const order = await base44.asServiceRole.entities.ProductOrder.create({
      product_id: product.id,
      product_name: product.name,
      user_email: user.email,
      price: product.price,
      category: product.category,
      telegram_username: user.telegram_username || '',
      status: 'completed'
    });
    const newBalance = await syncUserBalance(base44, user.email);
    return Response.json({
      success: true,
      product_name: product.name,
      order_id: order.id,
      price: product.price,
      balance: newBalance
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
