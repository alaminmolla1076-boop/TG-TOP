// Top-up request bridge: the bot's crypto flow shares the same on-chain
// deposit system as the app. USDT (TRC20/BEP20) uses the public edge functions
// (unique identify amount + wallet address, verified on-chain). TON is USDT on
// the TON network (the network's coin is now called Gram): the user sends the
// exact unique USDT jetton amount to the TON_DEPOSIT_ADDRESS and the transfer is
// verified on-chain via Toncenter.
import { entities } from '../_shared/entities.ts';
import { makeB44, secrets } from '../_shared/b44.ts';
import { syncUserBalance } from '../_shared/balance.ts';
import { notifyTopUpDecision } from '../_shared/moneyNotify.ts';
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
// Converts a TON address (EQ…/UQ… or raw 0:<hash>) to raw form for matching
// on-chain message and jetton-transfer destinations.
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
// Official Tether USD jetton on TON (6 decimals) — same public contract the
// app's TON network uses for USDT payments.
const TON_USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
// TON create — a USDT top-up on the TON network: unique identify amount in
// USDT (base + 1..5 unique cents) so the exact jetton amount matches one
// pending request on-chain. Credited 1:1 in USD once verified.
async function createTonUsdtRequest(body) {
  const usd = Number(body.amount);
  if (!usd || usd < 1 || usd > 1000) throw new Error('Amount must be between $1 and $1000');
  const depositAddress = String(secrets.get('TON_DEPOSIT_ADDRESS') || '').trim();
  if (!depositAddress) throw new Error('TON deposit address is not configured yet.');
  toRawAddress(depositAddress);
  let identify = 0, nano = '';
  for(let attempt = 0; attempt < 8; attempt++){
    const cents = Math.floor(Math.random() * 5) + 1;
    const candidate = Number((usd + cents / 100).toFixed(2));
    const candidateNano = String(Math.round(candidate * 1e6));
    const existing = await entities.TopUp.filter({
      tx_hash: `tonusdt:${candidateNano}`,
      status: 'pending'
    });
    if (!existing || existing.length === 0){
      identify = candidate;
      nano = candidateNano;
      break;
    }
  }
  if (!nano) throw new Error('All payment slots are busy. Please try again shortly.');
  const rec = await entities.TopUp.create({
    amount: identify,
    coin: 'USDT',
    network: 'TON',
    tx_hash: `tonusdt:${nano}`,
    status: 'pending',
    user_email: body.user_email
  });
  return {
    request: {
      request_id: rec.id,
      wallet_address: depositAddress,
      identify_amount: identify,
      coin: 'USDT',
      network: 'TON'
    }
  };
}
// TON check — verifies the exact USDT jetton transfer on-chain via Toncenter
// and approves the pending record (balance is computed from records, so
// approval credits it immediately).
async function checkTonUsdtRequest(rec) {
  if (rec.status === 'approved' || rec.status === 'rejected') return {
    status: rec.status
  };
  const nano = String(rec.tx_hash || '').replace(/^tonusdt:/, '');
  const depositAddress = String(secrets.get('TON_DEPOSIT_ADDRESS') || '').trim();
  if (!/^\d+$/.test(nano) || !depositAddress) return {
    status: 'pending'
  };
  const depositRaw = toRawAddress(depositAddress);
  const createdAt = Math.floor(new Date(rec.created_date).getTime() / 1000) - 60;
  const res = await fetch(`https://toncenter.com/api/v3/jetton/transfers?owner_address=${encodeURIComponent(depositAddress)}&jetton_master=${encodeURIComponent(TON_USDT_MASTER)}&limit=100`, {
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
  for (const tr of (data && data.jetton_transfers) || []){
    if (tr.transaction_aborted || !tr.transaction_now || tr.transaction_now < createdAt) continue;
    if (String(tr.destination).toLowerCase() === depositRaw && String(tr.amount) === nano){
      matched = tr;
      break;
    }
  }
  if (!matched) return {
    status: 'pending'
  };
  const hash = typeof matched.transaction_hash === 'string' ? matched.transaction_hash : '';
  if (!hash) return {
    status: 'pending'
  };
  // One on-chain transfer may only approve one request — reuse is rejected.
  const dupe = await entities.TopUp.filter({
    network: 'TON',
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
    status: 'approved',
    tx_hash: hash
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
      if (network === 'TON') return Response.json(await createTonUsdtRequest(body));
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
      // When an on-chain check flips a pending top-up to approved/rejected,
      // the user gets the professional success notice in their bot chat.
      const base44 = makeB44(req);
      const notifyOutcome = async (status, txHash) => {
        if (rec.status !== 'pending' || !['approved', 'rejected'].includes(status)) return;
        try {
          const balance = rec.user_email ? await syncUserBalance(base44, rec.user_email) : null;
          await notifyTopUpDecision(base44, rec.user_email, status, {
            ...rec,
            tx_hash: txHash || rec.tx_hash
          }, balance);
        } catch (e) {
          console.error('topup notify failed', e?.message);
        }
      };
      if (rec.network === 'TON') {
        const result = await checkTonUsdtRequest(rec);
        await notifyOutcome(result.status, result.tx_hash);
        return Response.json(result);
      }
      const result = await callPublicEdge('checkTopUpStatus', {
        request_id: body.request_id
      });
      // Supabase uses detected/expired; the flows use approved/rejected.
      const status = result.status === 'detected' ? 'approved' : result.status === 'expired' ? 'rejected' : result.status;
      await notifyOutcome(status);
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