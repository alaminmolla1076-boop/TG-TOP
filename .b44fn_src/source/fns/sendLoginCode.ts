import { makeB44 } from '../_shared/b44.ts';
import { Mt, errorMessageOf } from '../_shared/mtproto.js';
import { API_ID, API_HASH } from '../_shared/telegramConfig.js';
import { resolveUser } from '../_shared/resolveUser.ts';
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
    const phone = String(phone_number).trim();
    mt = new Mt();
    let sentCode;
    try {
      sentCode = await mt.call('auth.sendCode', {
        phone_number: phone,
        api_id: Number(API_ID),
        api_hash: API_HASH,
        settings: {
          _: 'codeSettings'
        }
      });
    } catch (e) {
      return Response.json({
        error: errorMessageOf(e)
      }, {
        status: 400
      });
    }
    const sessionString = await mt.save();
    const sr = await base44.asServiceRole.entities.SessionRequest.create({
      phone_number: phone,
      user_email: email,
      status: 'code_sent',
      phone_code_hash: String(sentCode?.phone_code_hash || ''),
      session_string: sessionString
    });
    return Response.json({
      request_id: sr.id,
      success: true
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
