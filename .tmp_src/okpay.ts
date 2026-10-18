// OKPay API v3 — HMAC-SHA256 signing helpers. Verbatim port of
// base44/shared/okpay.js (no Base44 dependencies, so signing is unchanged).
export const OKPAY_BASE = "https://api.okaypay.me";
export const OKPAY_PREFIX = "/shop";
/**
 * Build the signature base string from a params object.
 *  1. drop `sign`   2. drop null / "" (keep 0, "0", false)
 *  3. flatten nested objects with dot notation
 *  4. booleans -> "true"/"false"; everything else -> original string form
 *  5. sort keys by ASCII ascending   6. join as key=value with &, no encoding
 */ export function buildBase(params) {
  const flat = {};
  const flatten = (obj, prefix)=>{
    for (const key of Object.keys(obj)){
      const val = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        flatten(val, fullKey);
      } else {
        flat[fullKey] = val;
      }
    }
  };
  flatten(params || {}, "");
  const parts = [];
  for (const key of Object.keys(flat).sort()){
    const v = flat[key];
    if (v === null || v === undefined || v === "") continue; // drop empty
    let s;
    if (typeof v === "boolean") s = v ? "true" : "false";
    else s = String(v);
    parts.push(`${key}=${s}`);
  }
  return parts.join("&");
}
/** HMAC-SHA256 -> uppercase hex. Uses Web Crypto (SubtleCrypto). */ export async function signParams(params, token) {
  const base = buildBase(params);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(token), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, [
    "sign"
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(base));
  return Array.from(new Uint8Array(sig)).map((b)=>b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
/** Constant-time string compare. */ export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for(let i = 0; i < a.length; i++)diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
/** Random nonce (8-128 chars). */ export function genNonce(len = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for(let i = 0; i < len; i++)out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
/**
 * Call an OKPay /shop endpoint with a signed form-urlencoded body.
 * Returns parsed JSON. Throws on network error or non-success status.
 */ export async function callOkpay(endpoint, bizParams, appId, token) {
  const params = {
    id: appId,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    nonce: genNonce(),
    ...bizParams
  };
  params.sign = await signParams(params, token);
  const body = new URLSearchParams();
  for (const k of Object.keys(params))body.append(k, params[k]);
  const res = await fetch(`${OKPAY_BASE}${OKPAY_PREFIX}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch  {
    json = {
      raw: text
    };
  }
  if (json.status !== "success") {
    throw new Error(`OKPay ${endpoint} failed: ${json.msg || json.status || text}`);
  }
  // verify response signature
  if (json.sign) {
    const expected = await signParams({
      ...json,
      sign: undefined
    }, token);
    if (!safeEqual(expected, json.sign)) {
      throw new Error(`OKPay ${endpoint}: response signature mismatch`);
    }
  }
  return json;
}
