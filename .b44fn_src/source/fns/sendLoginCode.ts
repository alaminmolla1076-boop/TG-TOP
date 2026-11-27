import { makeB44 } from '../_shared/b44.ts';
import { Mt, errorMessageOf } from '../_shared/mtproto.js';
import { API_ID, API_HASH } from '../_shared/telegramConfig.js';
import { resolveUser } from '../_shared/resolveUser.ts';
import { isValidAgeCategory } from '../_shared/accountAge.js';
// Sends a Telegram login code to the given phone number.
// Stores the connection auth key + phone_code_hash in a SessionRequest record
// so verifyLoginCode can complete the sign-in in a separate request.
export default async function(req) {
  let mt;
  try {
    const base44 = makeB44(req);
    const body = await req.json();
    const user = await resolveUser(base44, body);
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const { phone_number, user_email } = body;
    if (!phone_number) return Response.json({
      error: 'phone_number required'
    }, {
      status: 400
    });
    const email = user_email || user.email;
    const age = String(body.age_selection || '').trim();
    if (!isValidAgeCategory(age)) return Response.json({ error: 'AGE_SELECTION_REQUIRED' }, { status: 400 });
    const phone = String(phone_number).trim();
    // If this seller just asked for a code, hand back that same request instead of
    // sending a second one: retries stay instant, and Telegram never sees a
    // duplicate auth.sendCode (which is what triggers FLOOD_WAIT / "busy").
    try {
      const recent = await base44.asServiceRole.entities.SessionRequest.filter({
        phone_number: phone,
        user_email: email,
        status: "code_sent"
      }, "-created_date", 1);
      const row = Array.isArray(recent) ? recent[0] : recent?.items?.[0];
      if (row?.id && Date.now() - new Date(row.created_date).getTime() < 5 * 60 * 1000) {
        return Response.json({ request_id: row.id, success: true, reused: true });
      }
    } catch {}
    // A dead socket must not cost the seller the code: retry once on a fresh
    // connection. Real Telegram rejections are returned straight away.
    const sendOnce = async () => {
      mt = new Mt();
      return await mt.call('auth.sendCode', {
        phone_number: phone,
        api_id: Number(API_ID),
        api_hash: API_HASH,
        settings: {
          _: 'codeSettings',
          // Official Telegram apps (and Telegram X) request the code as an
          // in-app message from the "Telegram" service chat. Without this flag
          // Telegram falls back to SMS, which it stopped sending to
          // third-party api_ids in February 2023: the call still succeeds, so
          // the seller waits forever for a code Telegram never sent.
          allow_app_hash: true
        }
      });
    };
    let sentCode;
    try {
      sentCode = await sendOnce();
    } catch (e) {
      const first = errorMessageOf(e);
      const transport = /ETIMEDOUT|not responding|timed? ?out|timeout|network|socket|websocket|handshake|connect|closed|ECONN|EPIPE|Internal|-503|RPC_CALL_FAIL/i.test(first);
      if (!transport) {
        return Response.json({
          error: first
        }, {
          status: 400
        });
      }
      try {
        mt?.close();
      } catch {}
      try {
        sentCode = await sendOnce();
      } catch (e2) {
        return Response.json({
          error: errorMessageOf(e2)
        }, {
          status: 400
        });
      }
    }
    // Telegram may still answer with the SMS / flash-call channel on the first
    // attempt. A third-party api_id cannot receive those, so ask once more and
    // let Telegram switch to the in-app channel before giving up.
    const channel = String(sentCode?.type?._ || '');
    if (/sentCodeTypeSms|sentCodeTypeFlashCall|sentCodeTypeCall/.test(channel)) {
      try {
        const resent = await mt.call('auth.resendCode', {
          phone_number: phone,
          phone_code_hash: String(sentCode?.phone_code_hash || '')
        });
        if (resent?.phone_code_hash) sentCode = resent;
      } catch {}
    }
    const sessionString = await mt.save();
    const sr = await base44.asServiceRole.entities.SessionRequest.create({
      phone_number: phone,
      user_email: email,
      age_selection: age,
      status: 'code_sent',
      phone_code_hash: String(sentCode?.phone_code_hash || ''),
      session_string: sessionString
    });
    return Response.json({
      request_id: sr.id,
      success: true,
      delivery: String(sentCode?.type?._ || '')
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  } finally{
    mt?.close();
  }
}