import { secrets } from "base44:runtime";
import { verifyInitData } from "../../shared/telegram.ts";

// One-time maintenance function: repairs/verifies the TELEGRAM_BOT_TOKEN in
// the linked Supabase project (the token was provided by the app owner in chat).
// This file is deleted right after the repair runs.

export default async function (req: Request): Promise<Response> {
  try {
    const BOT_TOKEN = "8814012015:AAGGyOiBrCAN94KNin_F-ahHoTTM1pOC1q8";
    const SUPABASE_REF = "kiglmpxkilgwzkuewuvb";
    const MGMT = `https://api.supabase.com/v1/projects/${SUPABASE_REF}`;
    const mgmtHeaders = {
      Authorization: `Bearer ${secrets.get("SUPABASE_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
    };

    // --- 1. Make sure the secret is stored (upsert) ---
    const post = await fetch(`${MGMT}/secrets`, {
      method: "POST",
      headers: mgmtHeaders,
      body: JSON.stringify([{ name: "TELEGRAM_BOT_TOKEN", value: BOT_TOKEN }]),
      signal: AbortSignal.timeout(15000),
    });
    const postStatus = post.status;

    // --- 2. End-to-end runtime test: sign initData with this token and ask
    // the b44fn router to authenticate it. If the Supabase runtime picked up
    // the token, signature verification passes — that is what actually matters. ---
    const enc = new TextEncoder();
    // Per Telegram spec: secret_key = HMAC_SHA256(key=bot_token, data="WebAppData")
    const tokenKey = await crypto.subtle.importKey("raw", enc.encode(BOT_TOKEN), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const secretKey = await crypto.subtle.sign("HMAC", tokenKey, enc.encode("WebAppData"));
    const hmacKey = await crypto.subtle.importKey("raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

    const ts = Math.floor(Date.now() / 1000);
    const params: Record<string, string> = {
      auth_date: String(ts),
      query_id: "fix-check",
      user: JSON.stringify({ id: 999999999, first_name: "TokenCheck" }),
    };
    const dataCheckString = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("\n");
    const sigBytes = await crypto.subtle.sign("HMAC", hmacKey, enc.encode(dataCheckString));
    const hash = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const initData = Object.keys(params)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join("&") + `&hash=${hash}`;

    // Which candidate token does the Supabase runtime actually use?
    // Sign the same initData with each candidate and see which one b44fn accepts.
    const signWithToken = async (token: string): Promise<string> => {
      const tk = await crypto.subtle.importKey("raw", enc.encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sk = await crypto.subtle.sign("HMAC", tk, enc.encode("WebAppData"));
      const hk = await crypto.subtle.importKey("raw", sk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", hk, enc.encode(dataCheckString));
      return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    // Read the currently stored (old) value from the Supabase secrets API
    const secRes0 = await fetch(`${MGMT}/secrets`, { headers: mgmtHeaders, signal: AbortSignal.timeout(15000) });
    const list0 = await secRes0.json();
    const arr0 = Array.isArray(list0) ? list0 : list0.secrets || [];
    const stored0 = arr0.find((s: any) => s.name === "TELEGRAM_BOT_TOKEN");
    const oldCandidates: Array<[string, string]> = [];
    if (stored0?.value) {
      oldCandidates.push(["stored_value", stored0.value]);
      oldCandidates.push(["stored_with_bot_id_prefix", `8814012015:${stored0.value}`]);
    }

    const anonRes = await fetch(`${MGMT}/api-keys`, { headers: mgmtHeaders, signal: AbortSignal.timeout(15000) });
    const anonJson = await anonRes.json();
    const anonArr = Array.isArray(anonJson) ? anonJson : anonJson.api_keys || [];
    const anonEntry0 = anonArr.find((k: any) => (k.name || (k.api_key && k.api_key.name)) === "anon");
    const anonKey0 = anonEntry0 ? (anonEntry0.api_key || anonEntry0.key) : null;

    const runtimeTokenProbe: any[] = [];
    for (const [label, candidate] of oldCandidates) {
      const candHash = await signWithToken(candidate);
      const candInitData = initData.replace(`hash=${hash}`, `hash=${candHash}`);
      const r = await fetch(`https://${SUPABASE_REF}.supabase.co/functions/v1/b44fn/telegramWebAppAuth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey0}`, apikey: anonKey0 },
        body: JSON.stringify({ initData: candInitData }),
        signal: AbortSignal.timeout(20000),
      });
      runtimeTokenProbe.push({ label, accepted: r.ok, status: r.status, body: (await r.text()).slice(0, 120) });
    }

    // The router requires the Supabase anon key in the Authorization header
    const keysRes = await fetch(`${MGMT}/api-keys`, { headers: mgmtHeaders, signal: AbortSignal.timeout(15000) });
    const keysJson = await keysRes.json();
    const keysArr = Array.isArray(keysJson) ? keysJson : keysJson.api_keys || [];
    const anonEntry = keysArr.find((k: any) => (k.name || (k.api_key && k.api_key.name)) === "anon");
    const anonKey = anonEntry ? (anonEntry.api_key || anonEntry.key) : null;

    const callAuth = () => fetch(`https://${SUPABASE_REF}.supabase.co/functions/v1/b44fn/telegramWebAppAuth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
      },
      body: JSON.stringify({ initData }),
      signal: AbortSignal.timeout(20000),
    });

    let authRes = await callAuth();
    let authText = (await authRes.text()).slice(0, 300);

    // Differential test: does the app's own verifier accept this signature?
    let localVerify: any = null;
    try {
      const localUser = await verifyInitData(initData);
      localVerify = { passes: true, userId: localUser?.id };
    } catch (e: any) {
      localVerify = { passes: false, error: String(e.message).slice(0, 100) };
    }

    // If the runtime still uses the old cached token, try to force a redeploy
    const redeploy: any = {};
    if (!authRes.ok) {
      for (const slug of ["b44fn", "botWebhook"]) {
        try {
          // Get current config so the PATCH keeps it intact
          const cfgRes = await fetch(`${MGMT}/functions/${slug}`, { headers: mgmtHeaders, signal: AbortSignal.timeout(15000) });
          if (cfgRes.ok) {
            const cfg = await cfgRes.json();
            const cfgRes2 = await fetch(`${MGMT}/functions/${slug}`, {
              method: "PATCH",
              headers: mgmtHeaders,
              body: JSON.stringify({ verify_jwt: cfg.verify_jwt, name: cfg.name }),
              signal: AbortSignal.timeout(30000),
            });
            redeploy[slug] = cfgRes2.ok ? "patched" : `${cfgRes2.status}`;
          } else {
            redeploy[slug] = `config api ${cfgRes.status}`;
          }
        } catch (e: any) {
          redeploy[slug] = String(e.message).slice(0, 60);
        }
      }
      // Give the redeploy/secret propagation a moment, then retest
      await new Promise((r) => setTimeout(r, 20000));
      authRes = await callAuth();
      authText = (await authRes.text()).slice(0, 300);
    }

    return Response.json({
      ok: authRes.ok,
      secretUpsertStatus: postStatus,
      anonKeyFound: !!anonKey,
      localVerify,
      redeploy,
      runtimeAuthTest: { status: authRes.status, body: authText },
    });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}