import { makeB44 } from '../_shared/b44.ts';
import { syncUserBalance } from '../_shared/balance.ts';
import { notifyTopUpDecision } from '../_shared/moneyNotify.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
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
    const { topup_id, status } = await req.json();
    if (!topup_id || ![
      'approved',
      'rejected'
    ].includes(status)) {
      return Response.json({
        error: 'topup_id and valid status required'
      }, {
        status: 400
      });
    }
    const topup = await base44.asServiceRole.entities.TopUp.get(topup_id);
    if (!topup) return Response.json({
      error: 'TopUp not found'
    }, {
      status: 404
    });
    // Mark the TopUp first, then sync balance from source-of-truth records.
    // This avoids reading the potentially-tampered User.balance field.
    await base44.asServiceRole.entities.TopUp.update(topup_id, {
      status
    });
    let balance = null;
    if (topup.user_email) {
      balance = await syncUserBalance(base44, topup.user_email);
    }
    try {
      // Professional localized notice in the user's own bot chat.
      await notifyTopUpDecision(base44, topup.user_email, status, topup, balance);
    } catch (notifyErr) {
      // Notifications are best-effort — never fail the approval.
      console.error('notify failed', notifyErr?.message);
    }
    return Response.json({
      success: true,
      status,
      balance,
      user_email: topup.user_email
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}