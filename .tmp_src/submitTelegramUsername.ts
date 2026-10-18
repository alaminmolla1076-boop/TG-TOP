import { makeB44 } from '../_shared/b44.ts';
import { notifyAdmins } from '../_shared/adminNotify.ts';
// Attaches the buyer's Telegram username to a product order and alerts admins
// so they can deliver the Premium / Stars purchase.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch  {
      user = null;
    }
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const { order_id, telegram_username } = await req.json().catch(()=>({}));
    if (!order_id || !telegram_username) {
      return Response.json({
        error: 'Order ID and Telegram username required'
      }, {
        status: 400
      });
    }
    const order = await base44.asServiceRole.entities.ProductOrder.get(order_id);
    if (!order) return Response.json({
      error: 'Order not found'
    }, {
      status: 404
    });
    if (order.user_email !== user.email) {
      return Response.json({
        error: 'Forbidden'
      }, {
        status: 403
      });
    }
    const cleanUsername = String(telegram_username).trim().replace(/^@/, '');
    await base44.asServiceRole.entities.ProductOrder.update(order_id, {
      telegram_username: cleanUsername
    });
    const categoryLabel = order.category === 'premium' ? 'Telegram Premium' : order.category === 'stars' ? 'Telegram Stars' : 'Product';
    await notifyAdmins(base44, `🛒 <b>New ${categoryLabel} Order</b>\n\n` + `<b>Product:</b> ${order.product_name || '-'}\n` + `<b>Amount:</b> $${Number(order.price || 0).toFixed(2)}\n` + `<b>Telegram:</b> @${cleanUsername}\n` + `<b>User:</b> ${user.email || '-'}`);
    return Response.json({
      success: true
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
