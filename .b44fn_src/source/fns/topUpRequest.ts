// Top-up request bridge: the bot's USDT Crypto flow shares the same on-chain
// deposit system as the app — createTopUpRequest (unique identify amount +
// wallet address, verified automatically on-chain) and checkTopUpStatus, both
// public edge functions deployed in the Supabase project.
async function callPublicEdge(name, body) {
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000)
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}
export default async function(req) {
  try {
    const body = await req.json().catch(()=>({}));
    // Create a deposit request: returns the wallet address for the network and
    // a unique "identify amount" whose extra cents mark this top-up on-chain.
    if (body.action === 'create') {
      const amount = Number(body.amount);
      const network = String(body.network || 'TRC20');
      if (!amount || amount <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });
      if (!['TRC20', 'BEP20'].includes(network)) return Response.json({ error: 'Invalid network' }, { status: 400 });
      const request = await callPublicEdge('createTopUpRequest', {
        user_email: body.user_email,
        amount,
        network,
        txid: 'tg-' + Date.now(),
        coin: 'USDT'
      });
      return Response.json({ request });
    }
    // Check the on-chain status of an existing request (owner-verified).
    if (body.action === 'check') {
      if (!body.request_id) return Response.json({ error: 'Missing request_id' }, { status: 400 });
      const { TopUp } = await import('../_shared/entities.ts');
      const rows = await TopUp.filter({ id: body.request_id });
      const rec = rows && rows[0];
      if (!rec) return Response.json({ error: 'Deposit request not found' }, { status: 404 });
      if (rec.user_email !== body.user_email) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const result = await callPublicEdge('checkTopUpStatus', { request_id: body.request_id });
      // Supabase uses detected/expired; the flows use approved/rejected.
      const status = result.status === 'detected' ? 'approved' : result.status === 'expired' ? 'rejected' : result.status;
      return Response.json({ ...result, status });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}