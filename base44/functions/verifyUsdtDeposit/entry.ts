import { runSql, sqlString, callPublicEdge } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');

    // Create a top-up request via the existing Supabase deposit system.
    // The user is given a unique "identify amount" and the deposit wallet address;
    // sending exactly that amount verifies the deposit on-chain automatically.
    if (body.action === 'create') {
      const amount = Number(body.amount);
      const network = String(body.network || 'TRC20');
      if (!amount || amount <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });
      if (!['TRC20', 'ERC20', 'BEP20'].includes(network)) {
        return Response.json({ error: 'Invalid network' }, { status: 400 });
      }
      const request = await callPublicEdge('createTopUpRequest', {
        user_email: identity.identity_email,
        amount,
        network,
        txid: 'web-' + Date.now(),
        coin: 'USDT',
      });
      return Response.json({ request });
    }

    // Check the on-chain status of an existing top-up request.
    if (body.action === 'check') {
      if (!body.request_id) return Response.json({ error: 'Missing request_id' }, { status: 400 });
      const rows = await runSql(
        `select id, user_email, status from top_ups where id = ${sqlString(body.request_id)} limit 1`
      );
      const rec = rows && rows[0];
      if (!rec) return Response.json({ error: 'Deposit request not found' }, { status: 404 });
      if (rec.user_email !== identity.identity_email && identity.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const result = await callPublicEdge('checkTopUpStatus', { request_id: body.request_id });
      // Supabase uses detected/expired; the wizard uses approved/rejected.
      const status = result.status === 'detected' ? 'approved'
        : result.status === 'expired' ? 'rejected' : result.status;
      return Response.json({ ...result, status });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}