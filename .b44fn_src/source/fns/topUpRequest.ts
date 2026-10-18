// Top-up request bridge: the bot's crypto flow shares the same on-chain
// deposit system as the app. USDT (TRC20/BEP20) uses the public edge functions
// (unique identify amount + wallet address, verified on-chain). TON mirrors the
// app's tonTopUp: the TON_DEPOSIT_ADDRESS secret, a unique TON amount at the
// live price, and Toncenter verification on check.
import { entities } from '../_shared/entities.ts';
import { secrets } from '../_shared/b44.ts';
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
// Converts a user-friendly TON address (EQ…/UQ…) to raw form (0:<hash>)
// for matching on-chain message destinations.
function toRawAddress(addr) {
  const a = String(addr || '').trim();
  if (/^-?\d+:[0-9a-fA-F]{64}$/.test(a)) return a.toLowerCase();
  const bin = atob(a.replace(/-/g, '+').replace(/_/g, '/'));
  if (bin.length !== 36) throw new Error('Invalid TON deposit address');
  const bytes = Uint8Array.from(bin, (c)=>c.charCodeAt(0));
  const wc = bytes[1] > 127 ? bytes[1] - 256 : bytes[1];
  const hash = Array.from(bytes.slice(2, 34), (b)=>b.toString(16).padStart(2, '0')).join('');
  return `${wc}:${hash}`;
}
// Live TON price: CoinGecko first, Kraken fallback when rate-limited.
async function getTonPriceUsd() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd', {
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const data = await res.json();
      const price = data && data['the-open-network'] && data['the-open-network'].usd;
      if (price && price > 0) return Number(price);
    }
  } catch  {}
  const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=TONUSD', {
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error('Could not fetch TON price');
  const data = await res.json();
  const price = data && data.result && data.result.TONUSD && data.result.TONUSD.c && data.result.TONUSD.c[0];
  if (!price || price <= 0) throw new Error('Could not fetch TON price');
  return Number(price);
}
// TON create — mirrors the app's tonTopUp flow: unique nano amount, pending
// record with coin TON, credited in USD once verified on-chain.
async function createTonRequest(body) {
  const usd = Number(body.amount);
  if (!usd || usd < 1 || usd > 1000) throw new Error('Amount must be between $1 and $1000');
  const depositAddress = String(secrets.get('TON_DEPOSIT_ADDRESS') || '').trim();
  if (!depositAddress) throw new Error('TON deposit address is not configured yet.');
  toRawAddress(depositAddress);
  const price = await getTonPriceUsd();
  const baseTon = Math.round(usd / price * 100) / 100;
  // Unique identify amount in TON (base + 1..5 unique cents) so the exact nano
  // amount matches one pending request on-chain.
  let nano = '';
  for(let attempt = 0; attempt < 8; attempt++){
    const cents = Math.floor(Math.random() * 5) + 1;
    const tonAmount = Math.round((baseTon + cents / 100) * 100) / 100;
    const candidate = String(Math.round(tonAmount * 1e9));
    const existing = await entities.TopUp.filter({
      tx_hash: `ton:${candidate}`,
      status: 'pending'
    });
    if (!existing || existing.length === 0){
      nano = candidate;
      break;
    }
  }
  if (!nano) throw new Error('All payment slots are busy. Please try again shortly.');
  const amountUsd = Math.round(Number(nano) / 1e9 * price * 100) / 100;
  const rec = await entities.TopUp.create({
    amount: amountUsd,
    coin: 'TON',
    network: 'TON',
    tx_hash: `ton:${nano}`,
    status: 'pending',
    user_email: body.user_email
  });
  return {
    request: {
      request_id: rec.id,
      wallet_address: depositAddress,
      identify_amount: Math.round(Number(nano) / 1e9 * 100) / 100,
      amount_usd: amountUsd,
      coin: 'TON'
    }
  };
}
// TON check — verifies the exact TON transfer on-chain via Toncenter and
// approves the pending record (balance is computed from records, so approval
// credits it immediately).
async function checkTonRequest(rec) {
  if (rec.status === 'approved' || rec.status === 'rejected') return {
    status: rec.status
  };
  const nano = String(rec.tx_hash || '').replace(/^ton:/, '');
  const depositAddress = String(secrets.get('TON_DEPOSIT_ADDRESS') || '').trim();
  if (!/^\d+$/.test(nano) || !depositAddress) return {
    status: 'pending'
  };
  const depositRaw = toRawAddress(depositAddress);
  const createdAt = Math.floor(new Date(rec.created_date).getTime() / 1000);
  const res = await fetch(`https://toncenter.com/api/v3/transactions?account=${encodeURIComponent(depositAddress)}&start_utime=${createdAt}&limit=50&sort=desc`, {
    headers: {
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) return {
    status: 'pending'
  };
  const data = await res.json();
  let matched = null;
  for (const tx of (data && data.transactions) || []){
    const msg = tx && tx.in_msg;
    if (!msg?.source || msg.bounced || tx.description?.aborted || tx.now < createdAt) continue;
    if (String(msg.destination).toLowerCase() === depositRaw && String(msg.value) === nano){
      matched = tx;
      break;
    }
  }
  if (!matched) return {
    status: 'pending'
  };
  const hash = typeof matched.hash === 'string' ? matched.hash : '';
  if (!hash) return {
    status: 'pending'
  };
  // One on-chain transfer may only approve one request — reuse is rejected.
  const dupe = await entities.TopUp.filter({
    coin: 'TON',
    tx_hash: hash
  });
  if ((dupe || []).some((r)=>r.id !== rec.id)) return {
    status: 'pending'
  };
  await entities.TopUp.update(rec.id, {
    status: 'approved',
    tx_hash: hash
  });
  return {
    status: 'approved'
  };
}
export default async function(req) {
  try {
    const body = await req.json().catch(()=>({}));
    // Create a deposit request: returns the wallet address for the network and
    // a unique "identify amount" whose extra cents mark this top-up on-chain.
    if (body.action === 'create') {
      const amount = Number(body.amount);
      const network = String(body.network || 'TRC20');
      if (!amount || amount <= 0) return Response.json({
        error: 'Invalid amount'
      }, {
        status: 400
      });
      if (![
        'TRC20',
        'BEP20',
        'TON'
      ].includes(network)) return Response.json({
        error: 'Invalid network'
      }, {
        status: 400
      });
      if (network === 'TON') return Response.json(await createTonRequest(body));
      const request = await callPublicEdge('createTopUpRequest', {
        user_email: body.user_email,
        amount,
        network,
        txid: 'tg-' + Date.now(),
        coin: 'USDT'
      });
      return Response.json({
        request
      });
    }
    // Check the on-chain status of an existing request (owner-verified).
    if (body.action === 'check') {
      if (!body.request_id) return Response.json({
        error: 'Missing request_id'
      }, {
        status: 400
      });
      const rows = await entities.TopUp.filter({
        id: body.request_id
      });
      const rec = rows && rows[0];
      if (!rec) return Response.json({
        error: 'Deposit request not found'
      }, {
        status: 404
      });
      if (rec.user_email !== body.user_email) return Response.json({
        error: 'Forbidden'
      }, {
        status: 403
      });
      if (rec.coin === 'TON') return Response.json(await checkTonRequest(rec));
      const result = await callPublicEdge('checkTopUpStatus', {
        request_id: body.request_id
      });
      // Supabase uses detected/expired; the flows use approved/rejected.
      const status = result.status === 'detected' ? 'approved' : result.status === 'expired' ? 'rejected' : result.status;
      return Response.json({
        ...result,
        status
      });
    }
    return Response.json({
      error: 'Unknown action'
    }, {
      status: 400
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}