import { runSql, sqlString, callB44 } from "../../shared/supabase.ts";

// Submits an account for sale through the existing Supabase b44fn function
// (sellSeason), which verifies the Telegram signature, creates the session
// request and starts the sale job. Requires a real Telegram user.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const countryIso = String(body.country_iso || '').trim().toUpperCase();
    const phone = String(body.phone_number || '').trim();

    if (!countryIso || !phone) {
      return Response.json({ error: 'Country and phone number are required' }, { status: 400 });
    }
    if (phone.length < 6 || phone.length > 20) {
      return Response.json({ error: 'Please enter a valid phone number with country code' }, { status: 400 });
    }

    const rows = await runSql(
      `select country_iso, country_name, reward_price, reward_wait_hours
       from reward_prices where country_iso = ${sqlString(countryIso)} and active = true limit 1`
    );
    const country = rows[0];
    if (!country) {
      return Response.json({ error: 'This country is not currently accepted' }, { status: 404 });
    }

    const reward = Number(country.reward_price) || 0;
    const waitHours = Number(country.reward_wait_hours) || 12;

    if (!body.initData) {
      return Response.json({ error: 'Open the app from Telegram to sell accounts' }, { status: 400 });
    }
    await callB44('sellSeason', {
      initData: body.initData,
      country_iso: countryIso,
      phone_number: phone,
    });

    return Response.json({
      sale: {
        id: '',
        country_iso: countryIso,
        phone_number: phone,
        reward_amount: reward,
        reward_wait_hours: waitHours,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}