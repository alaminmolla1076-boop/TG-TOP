import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";
import { callB44, runSql, sqlString } from "../../shared/supabase.ts";
import { verifyInitData } from "../../shared/telegram.ts";

export default async function(req) {
  const report = { ok: false };
  let probe = null;
  try {
    const client = createClientFromRequest(req);
    const admin = await client.auth.me();
    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const telegramId = String(8000000000000 + crypto.getRandomValues(new Uint32Array(1))[0]);
    const marker = "AuthCheck_" + crypto.randomUUID();
    const existing = await runSql(`select id from tg_web_users where telegram_id = ${sqlString(telegramId)} limit 1`);
    if (existing.length) throw new Error("Diagnostic identity collision; no changes made");
    probe = { telegramId, marker };
    const enc = new TextEncoder();
    const token = secrets.get("TELEGRAM_BOT_TOKEN");
    if (!token) throw new Error("Telegram bot token is not configured");
    const key = await crypto.subtle.importKey("raw", enc.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const derived = await crypto.subtle.sign("HMAC", key, enc.encode(token));
    const signingKey = await crypto.subtle.importKey("raw", derived, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const params = new URLSearchParams({
      auth_date: String(Math.floor(Date.now() / 1000)),
      query_id: "auth-diagnostic",
      user: JSON.stringify({ id: Number(telegramId), first_name: marker }),
      signature: "diagnostic",
    });
    const check = [...params.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${k}=${v}`).join("\n");
    const signed = await crypto.subtle.sign("HMAC", signingKey, enc.encode(check));
    params.set("hash", [...new Uint8Array(signed)].map(b => b.toString(16).padStart(2, "0")).join(""));
    const initData = params.toString();
    report.stage = "localSignature";
    const local = await verifyInitData(initData);
    report.localSignature = String(local.id) === telegramId;
    report.stage = "supabaseLogin";
    const login = await callB44("telegramWebAppAuth", { initData });
    report.supabaseLogin = String(login.telegram_id) === telegramId;
    report.stage = "authenticatedBalance";
    const balance = await callB44("getBalance", { initData });
    report.authenticatedBalance = Number.isFinite(Number(balance.balance));
    report.stage = "appLogin";
    const appLogin = await client.functions.invoke("telegramAuth", { initData });
    report.appLogin = String(appLogin.data.telegram_id) === telegramId;
    report.stage = "accountData";
    const account = await client.functions.invoke("getMyData", { initData });
    report.accountData = Array.isArray(account.data.deposits) && typeof account.data.balance === "number";
    params.set("hash", "0".repeat(64));
    report.forgedSignatureRejected = false;
    try {
      await verifyInitData(params.toString());
    } catch {
      report.forgedSignatureRejected = true;
    }
    report.ok = report.localSignature && report.supabaseLogin && report.authenticatedBalance && report.appLogin && report.accountData && report.forgedSignatureRejected;
    report.stage = "complete";
  } catch (error) {
    report.error = error.message;
  } finally {
    if (probe) {
      try {
        const rows = await runSql(`delete from tg_web_users where telegram_id = ${sqlString(probe.telegramId)} and identity_email = ${sqlString(`tg${probe.telegramId}@telegram.local`)} and telegram_first_name = ${sqlString(probe.marker)} returning id`);
        report.temporaryRecordsRemoved = rows.length;
      } catch (error) {
        report.ok = false;
        report.cleanupError = error.message;
      }
    }
  }
  return Response.json(report, { status: report.ok ? 200 : 500 });
}