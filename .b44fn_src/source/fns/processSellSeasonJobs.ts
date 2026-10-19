import { makeB44, secrets, waitUntil } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
import { selfInvoke, selfTrigger } from '../_shared/selfInvoke.ts';
import { t } from '../_shared/botTranslations.js';
import { tgSend, tgSendDoc, tgDeleteMessage } from '../_shared/telegramApi.ts';
// Wall-clock budget per run. When it runs out, progress is saved and a fresh
// request continues the job.
const BUDGET_MS = 100000;
// Sessions are processed ONE per HTTP request: Supabase enforces a per-request
// CPU budget and MTProto crypto is heavy, so batching several sessions into one
// request gets the isolate killed with "CPU Time exceeded".
async function runOne(session, user_email, admin_upload) {
  const { data } = await selfInvoke('sellSeason', {
    sessions: [
      session
    ],
    user_email,
    admin_upload
  });
  if (data.error) throw new Error(data.error);
  return data;
}
export default async function(req) {
  const startedAt = Date.now();
  try {
    const base44 = makeB44(req);
    if (!await isAdminRequest(base44)) {
      return Response.json({
        error: 'Admin only'
      }, {
        status: 403
      });
    }
    const token = secrets.get('TELEGRAM_BOT_TOKEN');
    if (!token) return Response.json({
      error: 'TELEGRAM_BOT_TOKEN not set'
    }, {
      status: 500
    });
    const allStates = await base44.asServiceRole.entities.BotState.list();
    const jobRec = allStates.find((s)=>(s.key || '').startsWith('sellseason_job:') && s.value);
    if (!jobRec) return Response.json({
      ok: true,
      sessions_processed: 0
    });
    let job;
    try {
      job = JSON.parse(jobRec.value);
    } catch  {
      await base44.asServiceRole.entities.BotState.delete(jobRec.id);
      return Response.json({
        ok: true,
        sessions_processed: 0
      });
    }
    const { chat_id, user_email, lang, reply_to, admin_upload } = job;
    const L = lang || 'en';
    // Sessions live in 200-item part records so huge uploads never hit
    // oversized-field errors.
    let sessions = job.sessions || [];
    if (job.job_ref) {
      const parts = allStates.filter((s)=>(s.key || '').startsWith(`sellseason_part:${job.job_ref}:`)).sort((a, b)=>Number(a.key.split(':').pop()) - Number(b.key.split(':').pop()));
      sessions = [];
      for (const p of parts){
        try {
          sessions.push(...JSON.parse(p.value));
        } catch  {}
      }
    }
    if (!sessions.length) {
      await base44.asServiceRole.entities.BotState.delete(jobRec.id);
      return Response.json({
        ok: true,
        sessions_processed: 0
      });
    }
    let index = job.index || 0;
    const totals = job.totals || {
      added: 0,
      failed: 0,
      reward: 0,
      byCountry: {},
      reasons: {},
      files: []
    };
    if (!totals.files) totals.files = [];
    let done = 0;
    while(index < sessions.length && Date.now() - startedAt < BUDGET_MS){
      let data;
      try {
        data = await runOne(sessions[index], user_email, admin_upload);
      } catch (err) {
        data = {
          added: 0,
          failed: 1,
          failed_details: [
            {
              reason: err?.message || 'error'
            }
          ]
        };
      }
      index++;
      done++;
      totals.added += data.added || 0;
      totals.failed += data.failed || 0;
      totals.reward += data.total_reward || 0;
      for (const [iso, count] of Object.entries(data.added_by_country || {})){
        totals.byCountry[iso] = (totals.byCountry[iso] || 0) + count;
      }
      const detail = (data.failed_details || [])[0];
      for (const f of data.failed_details || []){
        const reason = f.reason || 'Unknown';
        totals.reasons[reason] = (totals.reasons[reason] || 0) + 1;
      }
      if (data.failed_file_url) totals.files.push(data.failed_file_url);
      await base44.asServiceRole.entities.BotState.update(jobRec.id, {
        value: JSON.stringify({
          ...job,
          index,
          totals,
          status: 'processing'
        })
      });
      const line = data.added ? `✅ Session ${index}/${sessions.length} added` : `❌ Session ${index}/${sessions.length} failed — ${detail?.reason || 'unknown'}`;
      await tgSend(token, chat_id, line, reply_to);
    }
    if (index < sessions.length) {
      // Budget spent — continue in a fresh request (fresh CPU budget too).
      waitUntil(selfTrigger('processSellSeasonJobs', {}));
      return Response.json({
        ok: true,
        sessions_processed: done,
        resumed: true
      });
    }
    let msg = `${t(L, 'sell.seasonDone')}\n\n`;
    msg += `${t(L, 'sell.seasonAdded', {
      added: totals.added
    })}\n`;
    msg += `${t(L, 'sell.seasonFailed', {
      failed: totals.failed
    })}\n`;
    if (totals.reward) msg += `${t(L, 'sell.seasonReward', {
      reward: totals.reward.toFixed(2)
    })}\n`;
    if (Object.keys(totals.byCountry).length) {
      msg += `\n🌍 <b>By country:</b>\n`;
      for (const [iso, count] of Object.entries(totals.byCountry))msg += `• ${iso}: ${count}\n`;
    }
    if (Object.keys(totals.reasons).length) {
      msg += `\n❌ <b>Failed breakdown:</b>\n`;
      for (const [reason, count] of Object.entries(totals.reasons))msg += `• ${reason}: ${count}\n`;
    }
    await tgSend(token, chat_id, msg, reply_to);
    for (const url of totals.files){
      try {
        await tgSendDoc(token, chat_id, url, `❌ Recovery file for failed session`);
      } catch  {}
    }
    for (const mid of job.cleanup_msgs || []){
      try {
        await tgDeleteMessage(token, chat_id, mid);
      } catch  {}
    }
    try {
      await base44.asServiceRole.entities.BotState.delete(jobRec.id);
    } catch  {}
    if (job.job_ref) {
      const partIds = allStates.filter((s)=>(s.key || '').startsWith(`sellseason_part:${job.job_ref}:`)).map((s)=>s.id);
      for (const pid of partIds){
        try {
          await base44.asServiceRole.entities.BotState.delete(pid);
        } catch  {}
      }
    }
    return Response.json({
      ok: true,
      sessions_processed: done
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
