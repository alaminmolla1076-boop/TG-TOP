import { secrets } from "base44:runtime";

const SUPABASE_REF = "kiglmpxkilgwzkuewuvb";
const MGMT = "https://api.supabase.com/v1/projects/" + SUPABASE_REF;

// Runs a single SQL statement against the project's Postgres via the Supabase management API.
export async function runSql(query) {
  const res = await fetch(`${MGMT}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secrets.get("SUPABASE_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    const msg = j && (j.message || j.error) ? (j.message || j.error).slice(0, 200) : `Supabase query failed (${res.status})`;
    throw new Error(msg);
  }
  return await res.json();
}

// Safely escapes a value for inline SQL interpolation.
export function sqlString(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

let anonKeyCache = null;

async function getAnonKey() {
  if (anonKeyCache) return anonKeyCache;
  const res = await fetch(`${MGMT}/api-keys`, {
    headers: { Authorization: `Bearer ${secrets.get("SUPABASE_ACCESS_TOKEN")}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Could not reach Supabase (${res.status})`);
  const keys = await res.json();
  const anon = keys.find((k) => (k.name || (k.api_key && k.api_key.name)) === "anon");
  anonKeyCache = anon ? (anon.api_key || anon.key) : null;
  if (!anonKeyCache) throw new Error("Supabase anon key unavailable");
  return anonKeyCache;
}

// Calls an existing function on the b44fn router in the Supabase project,
// e.g. callB44("purchaseProduct", {...}) -> /functions/v1/b44fn/purchaseProduct.
// b44fn verifies the Telegram initData signature itself using the bot token.
export async function callB44(fn, body, timeoutMs = 25000) {
  const anonKey = await getAnonKey();
  const { initData, ...payload } = body || {};
  const telegramData = payload.init_data || initData || "";
  if (telegramData) payload.init_data = telegramData;
  const r = await fetch(`https://${SUPABASE_REF}.supabase.co/functions/v1/b44fn/${fn}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "Content-Type": "application/json",
      ...(telegramData ? { "x-tg-init-data": telegramData } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || data.message || `Supabase function ${fn} failed (${r.status})`);
  return data;
}

// Calls a public edge function deployed in the Supabase project (e.g. createTopUpRequest).
export async function callPublicEdge(name, body) {
  const anonKey = await getAnonKey();
  const r = await fetch(`https://${SUPABASE_REF}.supabase.co/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anonKeyCache}`,
      apikey: anonKeyCache,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Supabase function ${name} failed (${r.status})`);
  return data;
}