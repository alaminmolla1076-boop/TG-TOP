import { secrets } from "base44:runtime";
import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

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
  if (bin.length !== 48) throw new Error('Invalid TON deposit address');
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const wc = bytes[0] === 0xff ? -1 : bytes[0];
  const hash = Array.from(bytes.slice(1, 33), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${wc}:${hash}`;
}

async function getTonPriceUsd() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd", {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error("Could not fetch TON price");
  const data = await res.json();
  const price = data && data["the-open-network"] && data["the-open-network"].usd;
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
      if (!usd || usd < 1) return Response.json({ error: 'Amount must be at least $1' }, { status: 400 });
      const depositAddress = String(secrets.get('TON_DEPOSIT_ADDRESS') || '').trim();
      if (!depositAddress) {
        return Response.json({ error: 'TON deposit address is not configured yet (app secrets: TON_DEPOSIT_ADDRESS).' }, { status: 500 });
      }

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
      const rows = await runSql(
        `insert into top_ups (amount, coin, network, user_email, status, tx_hash)
         values (${amountUsd}, 'TON', 'TON', ${email}, 'pending', 'ton:${nano}')
         returning id, created_date`
      );
      const rec = rows && rows[0];
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
        `select id, user_email, status, tx_hash from top_ups where id = ${sqlString(body.request_id)} limit 1`
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
      const res = await fetch(
        `https://toncenter.com/api/v3/transactions?account=${encodeURIComponent(depositAddress)}&limit=50&sort=desc`,
        { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) return Response.json({ status: 'pending' });
      const data = await res.json();
      let matched = null;
      for (const tx of (data && data.transactions) || []) {
        const msg = tx && tx.in_msg;
        if (!msg || msg.bounced) continue;
        if (msg.destination === depositRaw && String(msg.value) === nano) { matched = tx; break; }
      }
      if (!matched) return Response.json({ status: 'pending' });

      const hash = (matched.transaction_id && matched.transaction_id.hash) || nano;
      await runSql(
        `update top_ups set status = 'approved', tx_hash = ${sqlString(hash)} where id = ${sqlString(rec.id)} and status = 'pending'`
      );
      return Response.json({ status: 'approved' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}