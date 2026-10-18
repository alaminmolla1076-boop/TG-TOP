import { makeB44 } from '../_shared/b44.ts';
import { syncUserBalance } from '../_shared/balance.ts';
import { notifyOnce, supportKeyboard } from '../_shared/adminNotify.ts';
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
    let balance = null;
    if (withdrawal.user_email) {
      balance = await syncUserBalance(base44, withdrawal.user_email);
    }
    try {
      // Rejected withdrawals get a "Contact Support" button.
      const keyboard = status === 'rejected' ? await supportKeyboard(base44) : null;
      await notifyOnce(base44, withdrawal.user_email, `${status === 'approved' ? '✅' : '❌'} <b>Withdrawal ${status === 'approved' ? 'Approved' : 'Rejected'}</b>\n\nAmount: $${(withdrawal.amount || 0).toFixed(2)} USDT\nAddress: <code>${withdrawal.wallet_address || '-'}</code>\nStatus: ${status === 'approved' ? 'Approved' : 'Rejected'}${balance !== null ? `\nBalance: $${balance.toFixed(2)}` : ''}`, keyboard);
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
