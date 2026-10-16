import { callB44 } from "../../shared/supabase.ts";

// Admin-only: approve or reject a pending top-up request through the existing
// Supabase b44fn function (approveTopUp), which verifies the Telegram
// signature and the caller's admin role, then credits the balance.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '');
    const action = String(body.action || '');
    if (!id || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Missing id or invalid action' }, { status: 400 });
    }
    if (!body.initData) {
      return Response.json({ error: 'Open the app from Telegram to review deposits' }, { status: 400 });
    }

    const decision = action === 'approve' ? 'approved' : 'rejected';
    await callB44('approveTopUp', {
      initData: body.initData,
      topup_id: id,
      approved: decision,
      decision,
    });
    return Response.json({ status: decision });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}