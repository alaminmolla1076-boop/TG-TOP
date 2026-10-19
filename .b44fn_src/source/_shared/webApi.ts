// Web-API layer for the frontend (hosted outside Base44): SQL and bridge calls.
// runSql executes the exact same SQL statements as the previous Base44-hosted
// functions, through the database's own exec_json executor (created in the
// project; callable only with the service role key, which never leaves this
// edge runtime). Rows come back as JSON — identical shapes to before.
export async function runSql(query) {
  const sr = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/exec_json`, {
    method: 'POST',
    headers: {
      apikey: sr,
      Authorization: `Bearer ${sr}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => null);
    const msg = j && (j.message || j.error) ? String(j.message || j.error).slice(0, 200) : `Supabase query failed (${r.status})`;
    throw new Error(msg);
  }
  return await r.json();
}

// Safely escapes a value for inline SQL interpolation.
export function sqlString(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

// Calls a function on this same b44fn router over real HTTP — every call gets
// a fresh isolate/CPU budget, which the heavy MTProto functions require.
// initData is moved to init_data + the x-tg-init-data header, exactly like the
// previous Base44-hosted bridge (base44/shared/supabase.ts callB44).
export async function callB44(fn, body, timeoutMs = 25000) {
  const { initData, ...payload } = body || {};
  const telegramData = payload.init_data || initData || '';
  if (telegramData) payload.init_data = telegramData;
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/b44fn/${fn}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
      ...(telegramData ? { 'x-tg-init-data': telegramData } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || data.message || `Supabase function ${fn} failed (${r.status})`);
  return data;
}

// Calls a public edge function deployed in the Supabase project
// (createTopUpRequest / checkTopUpStatus / processReferral).
export async function callPublicEdge(name, body) {
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Supabase function ${name} failed (${r.status})`);
  return data;
}