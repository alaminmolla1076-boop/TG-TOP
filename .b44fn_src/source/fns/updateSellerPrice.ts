import { makeB44 } from '../_shared/b44.ts';
import { admin } from '../_shared/entities.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
import { broadcastPriceDrop } from '../_shared/priceDropNotify.ts';
import { isValidAgeCategory } from '../_shared/accountAge.js';
// Lets a seller set the price for all their available accounts of a given
// country in ONE stock pool (Spam or Non-Spam). The new price applies only to
// that seller's listings — other sellers keep their own prices, and buyers pay
// whatever the seller set.
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
    const { country_iso, price, spam } = body;
    const poolSpam = !!spam;
    // Optional age bucket: when set, the price applies only to that age's
    // accounts of this country+pool ('' = the whole pool, any age).
    const ageCategory = body.age_category ? String(body.age_category).trim() : '';
    if (ageCategory && !isValidAgeCategory(ageCategory)) return Response.json({
      error: 'Invalid account age'
    }, {
      status: 400
    });
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
      owner_email: ownerEmail,
      spam: poolSpam,
      ...(ageCategory ? { age_category: ageCategory } : {})
    });
    // Empty pool: still remember the price for this pool (stock_prices), so
    // future stock — e.g. accounts the daily @SpamBot sweep promotes into the
    // Non-Spam pool — is listed at this price. No account update, no notice.
    if (!accounts.length) {
      await admin.from('stock_prices').upsert({
        owner_email: ownerEmail,
        country_iso,
        spam: poolSpam,
        age_category: ageCategory,
        price: Number(newPrice.toFixed(2))
      }, { onConflict: 'owner_email,country_iso,spam,age_category' });
      return Response.json({
        success: true,
        country_iso,
        spam: poolSpam,
        price: Number(newPrice.toFixed(2)),
        updated: 0
      });
    }
    // Snapshot taken BEFORE the update: the previous price and the stock pools
    // affected, so a price DROP can be announced to every user.
    const oldPrice = Math.max(...accounts.map((a) => Number(a.price) || 0));
    const spamPool = poolSpam ? 'spam' : 'nonspam';
    // Bulk-update all the seller's available accounts of this country.
    await base44.asServiceRole.entities.TgAccount.updateMany({
      country_iso,
      status: 'available',
      owner_email: ownerEmail,
      spam: poolSpam,
      ...(ageCategory ? { age_category: ageCategory } : {})
    }, {
      $set: {
        price: Number(newPrice.toFixed(2))
      }
    });
    // Remember the pool price: when the daily @SpamBot sweep moves one of this
    // seller's numbers from the Spam pool into the Non-Spam pool, the account
    // switches to this stored price.
    await admin.from('stock_prices').upsert({
      owner_email: ownerEmail,
      country_iso,
      spam: poolSpam,
      age_category: ageCategory,
      price: Number(newPrice.toFixed(2))
    }, { onConflict: 'owner_email,country_iso,spam,age_category' });
    // When the price went DOWN, tell everyone: who dropped it, country with
    // flag, Spam / Non-Spam pool, old and new price — in each user's language.
    // Pool-wide drops are announced to everyone; an age-specific price change
    // only affects that bucket's listings, so it stays out of the broadcast.
    if (!ageCategory && oldPrice > 0 && newPrice < oldPrice) {
      const countries = await base44.asServiceRole.entities.Country.filter({
        iso: country_iso
      }).catch(() => []);
      broadcastPriceDrop(base44, {
        sellerUsername: user.telegram_username || '',
        sellerName: user.telegram_first_name || '',
        sellerTelegramId: user.telegram_id,
        countryIso: country_iso,
        countryName: countries[0]?.name || country_iso,
        spamPool,
        oldPrice,
        newPrice: Number(newPrice.toFixed(2))
      });
    }
    return Response.json({
      success: true,
      country_iso,
      spam: poolSpam,
      age_category: ageCategory,
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