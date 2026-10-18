// Calls another function in this Edge Function over real HTTP instead of
// in-process.
//
// Why: Supabase kills an isolate that exceeds its CPU budget ("CPU Time
// exceeded"). MTProto session work is crypto-heavy, so several sessions handled
// inside one request always blow the budget. Every HTTP request gets a fresh
// budget, so heavy work is split one-session-per-request.
//
// The shared CRON_SECRET grants service-role privileges (see index.ts).
export async function selfInvoke(name, payload) {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/b44fn/${name}`;
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'x-cron-secret': Deno.env.get('CRON_SECRET') || ''
    },
    body: JSON.stringify(payload || {})
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok && data && !data.error) data.error = `HTTP ${res.status}`;
  return {
    data
  };
}
// Fire-and-forget trigger — used to continue a job in a fresh request.
export function selfTrigger(name, payload) {
  return selfInvoke(name, payload).catch(()=>{});
}
