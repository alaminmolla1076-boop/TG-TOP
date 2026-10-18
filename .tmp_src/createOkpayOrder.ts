import { makeB44, secrets } from '../_shared/b44.ts';
import { callOkpay } from '../_shared/okpay.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json();
    const user = await resolveUser(base44, body);
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const { amount, coin } = body;
    const amt = Number(amount);
    if (!amt || amt < 1) return Response.json({
      error: 'Minimum amount is $1'
    }, {
      status: 400
    });
    const coinCode = (coin || 'USDT').toUpperCase();
    const appId = secrets.get('OKPAY_APP_ID');
    const token = secrets.get('OKPAY_TOKEN');
    if (!appId || !token) return Response.json({
      error: 'OKPay not configured'
    }, {
      status: 500
    });
    // idempotent merchant order id
    const uniqueId = `TGTOP-${user.id || user.telegram_id}-${Date.now()}`;
    // Public callback URL — derived from this function's own URL, which keeps
    // the /functions/v1/b44fn/ prefix and just swaps the function name.
    // Internal (bot) invocations have no public URL, so fall back to the
    // project's function endpoint.
    const selfUrl = req.url.includes('/b44fn/') ? req.url : `${secrets.get('SUPABASE_URL')}/functions/v1/b44fn/createOkpayOrder`;
    const callbackUrl = selfUrl.split('createOkpayOrder')[0] + 'okpayCallback';
    const biz = {
      amount: String(amt),
      coin: coinCode,
      unique_id: uniqueId,
      name: 'TG Top Top-up',
      callback_url: callbackUrl
    };
    const resp = await callOkpay('payLink', biz, appId, token);
    const data = resp.data || {};
    // create pending TopUp record linked to the OKPay order
    const topup = await base44.asServiceRole.entities.TopUp.create({
      amount: amt,
      coin: coinCode,
      network: 'OKPay',
      tx_hash: data.order_id || '',
      status: 'pending',
      user_email: user.email
    });
    return Response.json({
      pay_url: data.pay_url,
      order_id: data.order_id,
      unique_id: uniqueId,
      topup_id: topup.id
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
