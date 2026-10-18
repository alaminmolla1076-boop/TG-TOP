import { makeB44 } from '../_shared/b44.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
// Lets a seller set the price for ALL their available accounts of a given
// country. The new price applies only to that seller's listings — other
// sellers keep their own prices, and buyers pay whatever the seller set.
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
    const { country_iso, price } = body;
    if (!country_iso) return Response.json({
      error: 'country_iso required'
    }, {
      status: 400
    });
    const newPrice = Number(price);
    if (!isFinite(newPrice) || newPrice < 0) {
      return Response.json({
        error: 'Invalid price'
      }, {
        status: 400
      });
    }
    // Accounts are stored with the tg identity email (tg{id}@telegram.local),
    // not the Base44 user email — derive the owner email the same way the
    // frontend does so the filter actually matches the seller's stock.
    const ownerEmail = body.user_email || (user.telegram_id ? `tg${user.telegram_id}@telegram.local` : user.email);
    // Count available accounts for this seller + country (to report back).
    const accounts = await base44.asServiceRole.entities.TgAccount.filter({
      country_iso,
      status: 'available',
      owner_email: ownerEmail
    });
    if (!accounts.length) {
      return Response.json({
        error: 'No available accounts for this country'
      }, {
        status: 400
      });
    }
    // Bulk-update all the seller's available accounts of this country.
    await base44.asServiceRole.entities.TgAccount.updateMany({
      country_iso,
      status: 'available',
      owner_email: ownerEmail
    }, {
      $set: {
        price: Number(newPrice.toFixed(2))
      }
    });
    return Response.json({
      success: true,
      country_iso,
      price: Number(newPrice.toFixed(2)),
      updated: accounts.length
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
