import { makeB44 } from '../_shared/b44.ts';
import { Mt, errorMessageOf } from '../_shared/mtproto.js';
import { API_ID, API_HASH } from '../_shared/telegramConfig.js';
import { resolveUser } from '../_shared/resolveUser.ts';
import { getState, setState } from '../bot/state.ts';
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
    // Speed: reusing one stored anonymous connection key skips the multi-second
    // DH handshake on every code request. Purely a connection-layer optimisation
    // — the login flow, what gets stored and how codes are verified are unchanged.
    const ANON_KEY = 'anonsess:2';
    const cached = (await getState(base44, ANON_KEY))?.value || '';
    const sendCode = (client) => client.call('auth.sendCode', {
      phone_number: phone,
      api_id: Number(API_ID),
      api_hash: API_HASH,
      settings: {
        _: 'codeSettings'
      }
    });
    mt = cached ? new Mt(cached) : new Mt();
    let sentCode;
    try {
      sentCode = await sendCode(mt);
    } catch (e) {
      // A reused key can go stale — only then fall back to one fresh handshake.
      // Real Telegram rejections (FLOOD_WAIT, PHONE_NUMBER_INVALID…) are
      // returned exactly as before, never retried here.
      if (cached && /AUTH_KEY|bad_server_salt|SESSION_EXPIRED|handshake|timed? ?out|timeout|network|socket|websocket|connect|closed|ECONN|EPIPE|ETIMEDOUT|fetch failed|Internal|-503|RPC_CALL_FAIL/i.test(errorMessageOf(e))) {
        mt.close();
        mt = new Mt();
        try {
          sentCode = await sendCode(mt);
        } catch (e2) {
          return Response.json({ error: errorMessageOf(e2) }, { status: 400 });
        }
      } else {
        return Response.json({
          error: errorMessageOf(e)
        }, {
          status: 400
        });
      }
    }
    const sessionString = await mt.save();
    // Persist the (new or refreshed) key so the next request reuses it.
    try {
      await setState(base44, ANON_KEY, sessionString);
    } catch { /* cache write is best-effort */ }
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