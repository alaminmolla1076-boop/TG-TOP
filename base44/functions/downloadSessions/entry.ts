import { runSql, sqlString, callB44 } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Redelivers a purchased batch's session-format ZIP to the buyer's Telegram
// chat. Reuses Supabase's existing generateSeasonZip — one ZIP holding every
// account's .session file (2FA already removed at purchase) plus the 2FA
// passwords note file. The caller must own the batch.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.initData) {
      return Response.json({ error: "Open the app from Telegram to download sessions" }, { status: 400 });
    }
    const batchId = String(body.batch_id || "").trim();
    if (!batchId) return Response.json({ error: "Missing batch_id" }, { status: 400 });

    const identity = await resolveIdentity(body.initData);
    const email = sqlString(identity.identity_email);
    const rows = await runSql(
      `select id from tg_accounts
       where owner_email = ${email} and status = 'sold'
         and purchase_type = 'season' and batch_id = ${sqlString(batchId)}`
    );
    if (!rows.length) {
      return Response.json({ error: "Purchase not found" }, { status: 404 });
    }

    const res = await callB44(
      "generateSeasonZip",
      { initData: body.initData, account_ids: rows.map((r) => r.id) },
      110000
    );
    return Response.json({
      count: res.count ?? 0,
      telegram_sent: !!res.telegram_sent,
      telegram_error: res.telegram_error || null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}