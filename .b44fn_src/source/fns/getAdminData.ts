import { makeB44 } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
// Loads all admin dashboard lists with the service role, so money records can
// stay admin-only without depending on the caller's literal role value.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    if (!await isAdminRequest(base44)) {
      return Response.json({
        error: 'Forbidden'
      }, {
        status: 403
      });
    }
    const sr = base44.asServiceRole.entities;
    const [countries, topups, withdrawals, products, productOrders] = await Promise.all([
      sr.Country.list('-created_date'),
      sr.TopUp.list('-created_date', 100),
      sr.Withdrawal.list('-created_date', 100),
      sr.Product.list('sort_order'),
      sr.ProductOrder.list('-created_date', 100)
    ]);
    return Response.json({
      countries,
      topups,
      withdrawals,
      products,
      productOrders
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
