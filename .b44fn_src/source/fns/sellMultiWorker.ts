import { makeB44, secrets, waitUntil } from '../_shared/b44.ts';
import { selfInvoke, selfTrigger } from '../_shared/selfInvoke.ts';
import { t } from '../_shared/botTranslations.js';
import { tgSend } from '../_shared/telegramApi.ts';
import { getState, setState, clearState } from '../bot/state.ts';
// Sell Multiple queue worker. After the seller sends a list of numbers (or a
// number finishes), this function scans forward through the queue and requests
// a login code for each number ONE per self-invoke — every HTTP request gets a
// fresh Supabase CPU budget, so a 100–200+ number list never blows the
// isolate. It stops at the first number whose code was sent (the seller must
// then reply with that number's OTP through the bot) and reports/skips numbers
// that fail. A wall-clock budget re-triggers a fresh request when spent, and a
// scan token guarantees only ONE worker runs per seller at a time.
const BUDGET_MS = 100000;
export default async function(req) {
  const startedAt = Date.now();
  try {
    const body = await req.json().catch(()=>({}));
    const tid = String(body.tid || '');
    if (!tid) return Response.json({
      error: 'tid required'
    }, {
      status: 400
    });
    const token = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!token) return Response.json({
      error: 'TELEGRAM_BOT_TOKEN not set'
    }, {
      status: 500
    });
    const base44 = makeB44(req);
    const rec = await getState(base44, `sellmulti:${tid}`);
    if (!rec) return Response.json({
      ok: true
    });
    let st;
    try {
      st = JSON.parse(rec.value);
    } catch {
      await clearState(base44, `sellmulti:${tid}`);
      return Response.json({
        ok: true
      });
    }
    // Only the single live scan may proceed — a stale trigger (duplicate reply,
    // retried request) must never start a second login-code pipeline for the
    // same queue, or Telegram answers with AUTH_RESTART for the same number.
    if (st.status !== 'processing' || st.sub !== 'scan' || st.scan_token !== body.token) return Response.json({
      ok: true
    });
    const L = st.lang || 'en';
    const chatId = Number(st.chat_id);
    const replyTo = st.reply_to || undefined;
    const numbers = st.numbers || [];
    let idx = st.idx || 0;
    st.done = st.done || 0;
    while(idx < numbers.length){
      // Budget spent — save progress and continue in a fresh request with a
      // fresh CPU budget.
      if (Date.now() - startedAt > BUDGET_MS) {
        st.idx = idx;
        st.scan_at = Date.now();
        await setState(base44, `sellmulti:${tid}`, JSON.stringify(st));
        waitUntil(selfTrigger('sellMultiWorker', {
          tid,
          token: st.scan_token
        }));
        return Response.json({
          ok: true,
          resumed: true
        });
      }
      const phone = numbers[idx];
      try {
        const result = await selfInvoke('sendLoginCode', {
          phone_number: phone,
          user_email: st.user_email
        });
        const data = result.data || result;
        if (data.error) throw new Error(data.error);
        // Code sent — pause the queue and wait for the seller's OTP reply.
        st.request_id = data.request_id;
        st.phone = phone;
        st.sub = 'otp';
        st.idx = idx;
        delete st.scan_at;
        await setState(base44, `sellmulti:${tid}`, JSON.stringify(st));
        await tgSend(token, chatId, t(L, 'sf.connecting', {
          phone
        }), replyTo);
        await tgSend(token, chatId, t(L, 'sf.codeSent', {
          phone
        }), replyTo);
        return Response.json({
          ok: true,
          waiting_otp: phone
        });
      } catch (err) {
        const m = String(err.message || '');
        const reason = /409|already exists|NUMBER_EXISTS/i.test(m) ? t(L, 'sf.alreadyIn') : m;
        await tgSend(token, chatId, t(L, 'sf.phoneIssue', {
          phone,
          reason
        }), replyTo);
        idx++;
        st.idx = idx;
        st.scan_at = Date.now();
        await setState(base44, `sellmulti:${tid}`, JSON.stringify(st));
      }
    }
    // Queue finished — final summary, then the flow state is cleared so the
    // seller can start a new list.
    const added = st.done || 0;
    await clearState(base44, `sellmulti:${tid}`);
    await tgSend(token, chatId, t(L, 'sf.sellMultiDone', {
      added,
      total: numbers.length
    }), replyTo);
    return Response.json({
      ok: true,
      added,
      total: numbers.length
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}