import { runSql, sqlString, callB44 } from '../_shared/webApi.ts';
import { resolveIdentity } from '../_shared/webIdentity.ts';
import { secrets } from '../_shared/b44.ts';

// TON top-ups via real Keeper Wallet connection (TonConnect).
// create: converts the chosen USD amount to a unique TON amount at the live
// CoinGecko price and records a pending top-up (credited USD = sent TON x price).
// check: verifies the exact TON transfer on-chain via Toncenter and approves it.

// Converts a user-friendly TON address (EQ…/UQ…) to raw form (0:<hash>)
// for matching on-chain message destinations.
function toRawAddress(addr) {
  const a = String(addr || '').trim();
  if (/^-?\d+:[0-9a-fA-F]{64}$/.test(a)) return a.toLowerCase();
  const bin = atob(a.replace(/-/g, '+').replace(/_/g, '/'));
  if (bin.length !== 36) throw new Error('Invalid TON deposit address');
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const wc = bytes[1] > 127 ? bytes[1] - 256 : bytes[1];
  const hash = Array.from(bytes.slice(2, 34), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${wc}:${hash}`;
}

async function getTonPriceUsd() {
  // Primary: CoinGecko. Fallback: Kraken (CoinGecko rate-limits shared IPs at times).
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd", {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const price = data && data["the-open-network"] && data["the-open-network"].usd;
      if (price && price > 0) return Number(price);
    }
  } catch (e) { /* try fallback */ }

  const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=TONUSD", {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Could not fetch TON price");
  const data = await res.json();
  const price = data && data.result && data.result.TONUSD && data.result.TONUSD.c && data.result.TONUSD.c[0];
  if (!price || price <= 0) throw new Error("Could not fetch TON price");
  return Number(price);
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || '');
    const email = sqlString(identity.identity_email);

    if (body.action === 'create') {
      const usd = Number(body.amount);
      if (!Number.isFinite(usd) || usd < 1) return Response.json({ error: 'Amount must be at least $1' }, { status: 400 });
      const depositAddress = String(secrets.get('TON_DEPOSIT_ADDRESS') || '').trim();
      if (!depositAddress) {
        return Response.json({ error: 'TON deposit address is not configured yet (app secrets: TON_DEPOSIT_ADDRESS).' }, { status: 500 });
      }

      toRawAddress(depositAddress);
      const price = await getTonPriceUsd();
      const baseTon = Math.round((usd / price) * 100) / 100;

      // Unique identify amount in TON (base + 1..5 unique cents) so the exact
      // nano amount matches one pending request on-chain.
      let nano = '';
      for (let attempt = 0; attempt < 8; attempt++) {
        const cents = Math.floor(Math.random() * 5) + 1;
        const tonAmount = Math.round((baseTon + cents / 100) * 100) / 100;
        const candidate = String(Math.round(tonAmount * 1e9));
        const existing = await runSql(
          `select id from top_ups where coin = 'TON' and tx_hash = 'ton:${candidate}' and status = 'pending' limit 1`
        );
        if (!existing || existing.length === 0) { nano = candidate; break; }
      }
      if (!nano) return Response.json({ error: 'All payment slots are busy. Please try again shortly.' }, { status: 409 });

      const amountUsd = Math.round((Number(nano) / 1e9) * price * 100) / 100;
      // Use the existing Supabase submission flow, including its Telegram
      // account resolution and notification, instead of a parallel SQL insert.
      await callB44('submitManualTopUp', {
        initData: body.initData,
        amount: amountUsd,
        coin: 'TON',
        network: 'TON',
        tx_hash: `ton:${nano}`,
      });
      const rows = await runSql(
        `select id, created_date from top_ups
         where user_email = ${email} and coin = 'TON' and tx_hash = 'ton:${nano}'
         order by created_date desc limit 1`
      );
      const rec = rows && rows[0];
      if (!rec) throw new Error('Top-up submission was not saved. Please try again.');
      return Response.json({
        request: {
          request_id: rec.id,
          amount_usd: amountUsd,
          amount_ton: Math.round((Number(nano) / 1e9) * 100) / 100,
          nano_amount: nano,
          deposit_address: depositAddress,
          created_date: rec.created_date,
        },
      });
    }

    if (body.action === 'check') {
      if (!body.request_id) return Response.json({ error: 'Missing request_id' }, { status: 400 });
      const rows = await runSql(
        `select id, user_email, status, tx_hash, created_date from top_ups where id = ${sqlString(body.request_id)} and coin = 'TON' limit 1`
      );
      const rec = rows && rows[0];
      if (!rec) return Response.json({ error: 'Top-up request not found' }, { status: 404 });
      if (rec.user_email !== identity.identity_email && identity.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (rec.status === 'approved' || rec.status === 'rejected') {
        return Response.json({ status: rec.status });
      }
      const nano = String(rec.tx_hash || '').replace(/^ton:/, '');
      const depositAddress = String(secrets.get('TON_DEPOSIT_ADDRESS') || '').trim();
      if (!/^\d+$/.test(nano) || !depositAddress) return Response.json({ status: 'pending' });

      const depositRaw = toRawAddress(depositAddress);
      const createdAt = Math.floor(new Date(rec.created_date).getTime() / 1000);
      const res = await fetch(
        `https://toncenter.com/api/v3/transactions?account=${encodeURIComponent(depositAddress)}&start_utime=${createdAt}&limit=50&sort=desc`,
        { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) return Response.json({ status: 'pending' });
      const data = await res.json();
      let matched = null;
      for (const tx of (data && data.transactions) || []) {
        const msg = tx && tx.in_msg;
        if (!msg?.source || msg.bounced || tx.description?.aborted || tx.now < createdAt) continue;
        if (String(msg.destination).toLowerCase() === depositRaw && String(msg.value) === nano) { matched = tx; break; }
      }
      if (!matched) return Response.json({ status: 'pending' });

      const hash = typeof matched.hash === 'string' ? matched.hash : '';
      if (!hash) return Response.json({ status: 'pending' });
      await runSql(
        `update top_ups set status = 'approved', tx_hash = ${sqlString(hash)}
         where id = ${sqlString(rec.id)} and status = 'pending'
         and not exists (select 1 from top_ups where coin = 'TON' and tx_hash = ${sqlString(hash)} and id <> ${sqlString(rec.id)})`
      );
      const result = await runSql(`select status from top_ups where id = ${sqlString(rec.id)} limit 1`);
      return Response.json({ status: result[0].status });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}