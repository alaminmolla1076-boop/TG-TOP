import { runSql, sqlString } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Admin-only: user list with optional search by Telegram username, numeric ID
// or email. Ordered by most recently seen.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const identity = await resolveIdentity(body.initData || "");
    if (identity.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const search = String(body.search || "").trim().toLowerCase().slice(0, 64);
    const like = sqlString("%" + search.replace(/[%_]/g, "") + "%");
    const where = search
      ? `where lower(u.telegram_username) like ${like} or u.telegram_id like ${like} or lower(u.identity_email) like ${like}`
      : "";

    const rows = await runSql(
      `select u.telegram_id, u.identity_email, u.telegram_username, u.telegram_first_name, u.telegram_last_name,
              u.banned as tg_banned, p.role, p.balance, p.banned as profile_banned
       from tg_web_users u
       left join profiles p on p.email = u.identity_email
       ${where}
       order by u.last_seen desc limit 100`
    );

    return Response.json({
      users: rows.map((r) => ({
        email: r.identity_email,
        telegram_id: String(r.telegram_id),
        username: r.telegram_username || "",
        first_name: r.telegram_first_name || "",
        role: r.role || "user",
        balance: Number(r.balance) || 0,
        banned: Boolean(r.tg_banned || r.profile_banned),
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}