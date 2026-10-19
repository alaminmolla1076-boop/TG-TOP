import { makeB44 } from '../_shared/b44.ts';
import { syncUserBalance } from '../_shared/balance.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
export default async function(req) {
  try {
    const base44 = makeB44(req);
    if (!await isAdminRequest(base44)) {
      return Response.json({
        error: 'Admin only'
      }, {
        status: 403
      });
    }
    const body = await req.json();
    // The app sends `email`, the bot's /add_balance sends `user_email`.
    const rawEmail = body.email || body.user_email;
    const { amount, target_balance } = body;
    if (!rawEmail) return Response.json({
      error: 'email required'
    }, {
      status: 400
    });
    const users = await base44.asServiceRole.entities.User.filter({
      email: String(rawEmail).toLowerCase().trim()
    });
    if (!users.length) return Response.json({
      error: 'User not found'
    }, {
      status: 404
    });
    const target = users[0];
    // Two modes:
    // 1) target_balance — set the user's balance to an exact value
    // 2) amount — add (or subtract if negative) a relative adjustment
    let adjustment = 0;
    if (typeof target_balance === 'number') {
      const currentBalance = await syncUserBalance(base44, target.email);
      adjustment = Math.round((target_balance - currentBalance) * 100) / 100;
    } else {
      adjustment = Number(amount);
    }
    if (!adjustment) {
      return Response.json({
        error: 'No change needed — amount is zero'
      }, {
        status: 400
      });
    }
    // Create an approved TopUp record (source of truth). Negative adjustments
    // are recorded as a deduction so getRealBalance reflects the change.
    await base44.asServiceRole.entities.TopUp.create({
      user_email: target.email,
      amount: adjustment,
      coin: 'USDT',
      network: adjustment >= 0 ? 'admin_credit' : 'admin_debit',
      status: 'approved'
    });
    const newBalance = await syncUserBalance(base44, target.email);
    return Response.json({
      success: true,
      email: target.email,
      name: target.full_name,
      newBalance
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
