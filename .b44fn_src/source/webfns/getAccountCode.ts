import { callB44 } from '../_shared/webApi.ts';

// Get Code: reads the account's Telegram session LIVE and returns the login
// code Telegram delivered after this purchase. Stored rows are never trusted
// alone — a code captured before the buyer requested one is the seller's own
// (already used) code and always invalid.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawId = String(body.account_id || '').trim();
    if (!rawId) return Response.json({ error: 'Missing account_id' }, { status: 400 });
    if (!body.initData) return Response.json({ error: 'Open the app from Telegram to get codes' }, { status: 400 });

    const res = await callB44('fetchOtpCode', {
      initData: body.initData,
      account_id: rawId,
    }, 60000);

    return Response.json({
      code: res.code,
      status: 'fulfilled',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}