import { callB44 } from "../../shared/supabase.ts";

// Telegram Mini App login — delegated entirely to the existing Supabase b44fn
// function (telegramWebAppAuth): it verifies the initData signature with the
// bot token, auto-signs-up the user and returns their profile and balance.
// The app must be opened from the Telegram bot.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = body.initData || "";
    if (!initData) {
      return Response.json({ error: "Open the app from Telegram to sign in" }, { status: 401 });
    }

    const res = await callB44("telegramWebAppAuth", { initData });
    const u = res.user && typeof res.user === "object" ? res.user : {};
    const telegramId = String(res.telegram_id ?? u.id ?? "");

    return Response.json({
      telegram_id: telegramId,
      identity_email:
        res.identity_email || res.email || u.email || (telegramId ? `tg${telegramId}@telegram.local` : ""),
      username: res.username ?? res.telegram_username ?? u.username ?? "",
      first_name: res.first_name ?? res.telegram_first_name ?? u.first_name ?? "",
      last_name: res.last_name ?? res.telegram_last_name ?? u.last_name ?? "",
      photo_url: res.photo_url ?? u.photo_url ?? "",
      role: res.role ?? (res.profile && res.profile.role) ?? "user",
      balance: Number(res.balance ?? (res.profile && res.profile.balance)) || 0,
    });
  } catch (error) {
    const suspended = /suspend|ban/i.test(String(error.message || ""));
    return Response.json({ error: error.message }, { status: suspended ? 403 : 401 });
  }
}