import { callB44 } from "../../shared/supabase.ts";
import { resolveIdentity } from "../../shared/telegram.ts";

// Step 1 of the sell flow: asks the existing Supabase b44fn function
// (sendLoginCode) to send a Telegram login code to the seller's number.
// The request is stored in Supabase with status "code_sent".
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body.phone_number || "").trim();
    if (!body.initData) {
      return Response.json({ error: "Open the app from Telegram to sell accounts" }, { status: 400 });
    }
    if (!/^\+[0-9]{6,19}$/.test(phone)) {
      return Response.json({ error: "Enter the number in international format, e.g. +8801XXXXXXXXX" }, { status: 400 });
    }

    const ageSelection = String(body.age_selection || "").trim();
    const identity = await resolveIdentity(body.initData);
    const res = await callB44(
      "sendLoginCode",
      { initData: body.initData, phone_number: phone, ...(ageSelection ? { age_selection: ageSelection } : {}) },
      120000
    );
    if (res.success !== true || !res.request_id) {
      return Response.json({ error: res.error || "Supabase did not confirm the login-code request" }, { status: 400 });
    }
    return Response.json({ success: res.success, request_id: res.request_id, delivery: res.delivery || "" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}