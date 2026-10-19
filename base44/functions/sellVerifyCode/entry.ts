import { runSql, sqlString, callB44 } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Step 2 of the sell flow: submits the Telegram login code the seller received.
// Supabase signs in to the account, adds a system 2FA password and puts the
// account into the seller's own stock (TgAccount with owner_email = seller).
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestId = String(body.request_id || "").trim();
    const code = String(body.phone_code || "").trim();
    if (!body.initData) {
      return Response.json({ error: "Open the app from Telegram to sell accounts" }, { status: 400 });
    }
    if (!requestId) {
      return Response.json({ error: "Missing sale request — start again with your number" }, { status: 400 });
    }
    if (!code) {
      return Response.json({ error: "Enter the login code you received" }, { status: 400 });
    }

    const identity = await resolveIdentity(body.initData);
    // The pending code request must belong to the caller — nobody may
    // verify somebody else's sale request.
    const rows = await runSql(
      `select user_email from session_requests where id = ${sqlString(requestId)} limit 1`
    );
    if (!rows[0]) {
      return Response.json({ error: "Invalid or expired request" }, { status: 400 });
    }
    if (rows[0].user_email !== identity.identity_email) {
      return Response.json({ error: "This sale request does not belong to you" }, { status: 403 });
    }

    const res = await callB44("verifyLoginCode", { initData: body.initData, request_id: requestId, phone_code: code }, 180000);
    if (res.success !== true) {
      return Response.json({ error: res.error || "Supabase did not confirm the account was saved" }, { status: 400 });
    }
    return Response.json({
      success: res.success,
      phone: res.phone,
      country: res.country,
      country_iso: res.country_iso,
      spam: res.spam === true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}