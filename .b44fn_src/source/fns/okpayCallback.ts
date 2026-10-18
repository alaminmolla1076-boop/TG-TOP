import { makeB44, secrets } from '../_shared/b44.ts';
import { signParams, safeEqual } from '../_shared/okpay.ts';
import { syncUserBalance } from '../_shared/balance.ts';
import { notifyAdmins, notifyUser } from '../_shared/adminNotify.ts';
// Public webhook — no user auth. Authenticity verified by HMAC-SHA256 signature.
export default async function(req) {
  try {
    const appId = secrets.get('OKPAY_APP_ID');
    const token = secrets.get('OKPAY_TOKEN');
    if (!appId || !token) return Response.json({
      error: 'not configured'
    }, {
      status: 500
    });
    // OKPay posts application/x-www-form-urlencoded
    const form = await req.formData();
    const params = {};
    for (const [k, v] of form.entries())params[k] = v;
    const receivedSign = params.sign;
    if (!receivedSign) return Response.json({
      error: 'missing sign'
    }, {
      status: 400
    });
    // verify signature (recompute over all fields except sign)
    const { sign: _drop, ...rest } = params;
    const expected = await signParams(rest, token);
    if (!safeEqual(expected, receivedSign)) {
      return Response.json({
        error: 'invalid signature'
      }, {
        status: 403
      });
    }
    // only handle deposit callbacks
    const type = params.type;
    if (type !== 'deposit') {
      return Response.json({
        ok: true,
        ignored: type
      });
    }
    const status = String(params.status);
    const orderId = params.order_id;
    const uniqueId = params.unique_id;
    const base44 = makeB44(req);
    // status "1" = paid (terminal). Find the pending TopUp by tx_hash (order_id),
    // mark it approved, then sync User.balance from source-of-truth records.
    if (status === '1' && orderId) {
      const matches = await base44.asServiceRole.entities.TopUp.filter({
        tx_hash: orderId,
        status: 'pending'
      });
      for (const t of matches){
        await base44.asServiceRole.entities.TopUp.update(t.id, {
          status: 'approved'
        });
        if (t.user_email) {
          await syncUserBalance(base44, t.user_email);
        }
        await notifyAdmins(base44, `✅ <b>Deposit Approved (OKPay)</b>\n\nUser: ${t.user_email || '-'}\nAmount: $${(t.amount || 0).toFixed(2)} ${t.coin || ''}\nOrder: <code>${orderId}</code>`);
        await notifyUser(base44, t.user_email, `✅ <b>Deposit Approved</b>\n\nAmount: $${(t.amount || 0).toFixed(2)} ${t.coin || ''}\nOrder: <code>${orderId}</code>\n\nYour deposit has been credited.`);
      }
    }
    // always 200 so OKPay stops retrying
    return Response.json({
      ok: true,
      status,
      order_id: orderId,
      unique_id: uniqueId
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
