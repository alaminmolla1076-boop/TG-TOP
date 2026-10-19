import { makeB44, secrets } from '../_shared/b44.ts';
import { callOkpay } from '../_shared/okpay.ts';
import { syncUserBalance } from '../_shared/balance.ts';
import { notifyTopUpDecision } from '../_shared/moneyNotify.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
// Polling fallback — called by the frontend after the user returns from OKPay.
// Verifies the order is paid via checkTransferByTxid, then approves the TopUp
// and syncs the balance from source-of-truth records.
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
    const { topup_id } = body;
    if (!topup_id) return Response.json({
      error: 'topup_id required'
    }, {
      status: 400
    });
    const topups = await base44.asServiceRole.entities.TopUp.filter({
      id: topup_id,
      user_email: user.email
    });
    const topup = topups[0];
    if (!topup) return Response.json({
      error: 'TopUp not found'
    }, {
      status: 404
    });
    if (topup.status === 'approved') return Response.json({
      status: 'approved'
    });
    const orderId = topup.tx_hash;
    if (!orderId) return Response.json({
      error: 'No order ID on record'
    }, {
      status: 400
    });
    const appId = secrets.get('OKPAY_APP_ID');
    const token = secrets.get('OKPAY_TOKEN');
    if (!appId || !token) return Response.json({
      error: 'OKPay not configured'
    }, {
      status: 500
    });
    const resp = await callOkpay('checkTransferByTxid', {
      txid: orderId
    }, appId, token);
    const data = resp.data || {};
    const okpayStatus = String(data.status);
    if (okpayStatus === '1') {
      await base44.asServiceRole.entities.TopUp.update(topup.id, {
        status: 'approved'
      });
      let okpayBalance = null;
      if (topup.user_email) {
        okpayBalance = await syncUserBalance(base44, topup.user_email);
      }
      try {
        await notifyTopUpDecision(base44, topup.user_email, 'approved', topup, okpayBalance);
      } catch (notifyErr) {
        console.error('notify failed', notifyErr?.message);
      }
      return Response.json({
        status: 'approved'
      });
    }
    return Response.json({
      status: 'pending',
      okpay_status: okpayStatus
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      status: 'pending'
    }, {
      status: 500
    });
  }
}