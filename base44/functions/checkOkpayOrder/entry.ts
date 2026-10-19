import { callB44 } from "../../shared/supabase.ts";

// Checks an OKPay order's paid status through the Supabase b44fn function
// (checkOkpayOrder), which approves the pending TopUp and syncs the balance
// once OKPay reports the transfer as complete.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.initData) {
      return Response.json({ error: 'Open the app from Telegram to continue' }, { status: 400 });
    }
    if (!body.topup_id) {
      return Response.json({ error: 'Missing topup_id' }, { status: 400 });
    }
    const res = await callB44('checkOkpayOrder', {
      initData: body.initData,
      topup_id: body.topup_id,
    });
    return Response.json({ status: res.status || 'pending' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}