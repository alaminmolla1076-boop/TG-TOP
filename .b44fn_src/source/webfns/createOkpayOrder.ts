import { callB44 } from '../_shared/webApi.ts';

// Creates an OKPay payment order through the existing Supabase b44fn function
// (createOkpayOrder), which signs the request with the shop credentials,
// creates a pending TopUp record and returns the hosted payment link.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.initData) {
      return Response.json({ error: 'Open the app from Telegram to top up' }, { status: 400 });
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      return Response.json({ error: 'Minimum top-up is $1' }, { status: 400 });
    }
    const res = await callB44('createOkpayOrder', {
      initData: body.initData,
      amount,
      coin: 'USDT',
    });
    if (!res.pay_url) {
      return Response.json({ error: 'OKPay did not return a payment link' }, { status: 502 });
    }
    return Response.json({
      pay_url: res.pay_url,
      order_id: res.order_id,
      topup_id: res.topup_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}