import { secrets } from "base44:runtime";
import { runSql, sqlString } from "./supabase.ts";

const enc = new TextEncoder();

async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verifies Telegram Mini App initData against the bot token, per Telegram's spec.
export async function verifyInitData(initData) {
  const botToken = secrets.get("TELEGRAM_BOT_TOKEN");
  const params = [...new URLSearchParams(initData).entries()];
  const hash = params.find(([k]) => k === "hash")?.[1];
  if (!botToken || !hash) throw new Error("Telegram login verification failed");
  const checkString = params
    .filter(([k]) => k !== "hash")
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secretKeyRaw = await crypto.subtle.importKey("raw", enc.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const secretKey = await crypto.subtle.sign("HMAC", secretKeyRaw, enc.encode(botToken));
  const computed = await hmacSha256(secretKey, checkString);
  if (computed !== hash) throw new Error("Telegram login verification failed");
  const userRaw = new URLSearchParams(initData).get("user");
  if (!userRaw) throw new Error("No Telegram user in login data");
  return JSON.parse(userRaw);
}


// Resolves the acting Telegram user from initData (required — the app must be
// opened from the Telegram bot). Sign-up, profile creation and wallet setup all
// happen in the existing Supabase system (b44fn telegramWebAppAuth at login) —
// here we only READ the user's records to know their role and balance.
export async function resolveIdentity(initData) {
  if (!initData) throw new Error("Open the app from Telegram to continue");
  const tgUser = await verifyInitData(initData);

  const telegramId = String(tgUser.id);
  const identityEmail = `tg${telegramId}@telegram.local`;

  const rows = await runSql(
    `select u.banned as tg_banned, p.role, p.balance, p.banned as profile_banned
     from tg_web_users u
     left join profiles p on p.email = u.identity_email
     where u.telegram_id = ${sqlString(telegramId)} limit 1`
  );
  const row = rows && rows[0];
  if (!row) throw new Error("Open the app from Telegram to create your account");
  if (row.tg_banned || row.profile_banned) throw new Error("Your account is banned");

  return {
    telegram_id: telegramId,
    identity_email: identityEmail,
    username: tgUser.username || "",
    first_name: tgUser.first_name || "",
    last_name: tgUser.last_name || "",
    photo_url: tgUser.photo_url || "",
    profile: { role: row.role || "user", balance: Number(row.balance) || 0 },
    role: row.role || "user",
  };
}