import { makeB44 } from '../_shared/b44.ts';
import { syncUserBalance } from '../_shared/balance.ts';
import { notifyWithdrawalDecision } from '../_shared/moneyNotify.ts';
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
    const { withdrawal_id, status } = await req.json();
    if (!withdrawal_id || ![
      'approved',
      'rejected'
    ].includes(status)) {
      return Response.json({
        error: 'withdrawal_id and valid status required'
      }, {
        status: 400
      });
    }
    const withdrawal = await base44.asServiceRole.entities.Withdrawal.get(withdrawal_id);
    if (!withdrawal) return Response.json({
      error: 'Withdrawal not found'
    }, {
      status: 404
    });
    if (withdrawal.status !== 'pending') {
      return Response.json({
        error: 'Withdrawal already processed'
      }, {
        status: 400
      });
    }
    // Mark the withdrawal status first, then sync balance from source-of-truth.
    // On rejection, getRealBalance no longer counts this withdrawal as a debit,
    // so the held amount is automatically returned.
    await base44.asServiceRole.entities.Withdrawal.update(withdrawal_id, {
      status
    });
    // On rejection the held amount is returned by the balance view; the $0.10
    // fee ledger row is removed with it so the user is fully refunded.
    if (status === 'rejected') {
      const feeRows = await base44.asServiceRole.entities.TopUp.filter({
        network: 'withdrawal_fee',
        tx_hash: `wfee:${withdrawal_id}`
      });
      for (const row of feeRows || [])await base44.asServiceRole.entities.TopUp.delete(row.id);
    }
    let balance = null;
    if (withdrawal.user_email) {
      balance = await syncUserBalance(base44, withdrawal.user_email);
    }
    try {
      // Professional localized notice in the user's own bot chat.
      await notifyWithdrawalDecision(base44, withdrawal.user_email, status, withdrawal, balance);
    } catch (notifyErr) {
      console.error('notify failed', notifyErr?.message);
    }
    return Response.json({
      success: true,
      status,
      balance,
      user_email: withdrawal.user_email
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}