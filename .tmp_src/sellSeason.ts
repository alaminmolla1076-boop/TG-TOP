import { makeB44 } from '../_shared/b44.ts';
import { Mt, errorMessageOf, parseSessionString } from '../_shared/mtproto.js';
import { API_ID, API_HASH } from '../_shared/telegramConfig.js';
import { generatePassword, setTwoFactorPassword } from '../_shared/twoFactor.js';
import { syncCountryStock } from '../_shared/inventory.js';
import { normalizeSessionInput } from '../_shared/sessionParser.js';
import { checkSpamBotStatus } from '../_shared/spamBot.js';
import { findAcceptedCountry } from '../_shared/acceptedCountries.js';
import { resolveUser } from '../_shared/resolveUser.ts';
import { buildSessionFile } from '../_shared/sqliteBuilder.js';
import { createZip } from '../_shared/zipBuilder.js';
// User-driven bulk sell: each pasted StringSession is connected, validated,
// country-detected, SpamBot-checked and given a system 2FA password. Clean
// accounts are bulk-written to stock with pending reward records; failures never
// enter stock and are returned as a recovery ZIP of .session files.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json();
    const user = await resolveUser(base44, body);
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const { sessions, user_email, admin_upload } = body;
    const isAdminUpload = admin_upload === true;
    const email = user_email || user.email;
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return Response.json({
        error: 'sessions[] required'
      }, {
        status: 400
      });
    }
    // Pre-fetch reward prices and countries once — no DB calls per session.
    const rewardMap = {};
    try {
      const allRewards = await base44.asServiceRole.entities.RewardPrice.filter({
        active: true
      });
      for (const r of allRewards){
        rewardMap[r.country_iso] = {
          reward_price: r.reward_price,
          reward_wait_hours: r.reward_wait_hours != null ? r.reward_wait_hours : 12,
          active: r.active !== false
        };
      }
    } catch (e) {}
    const countryByIso = {};
    const dialCodeSorted = [];
    try {
      const allCountries = await base44.asServiceRole.entities.Country.list();
      for (const c of allCountries){
        countryByIso[c.iso] = c;
        if (c.dial_code) dialCodeSorted.push(c);
      }
      dialCodeSorted.sort((a, b)=>(b.dial_code || '').length - (a.dial_code || '').length);
    } catch (e) {}
    const detectCountryLocal = (phone)=>{
      const accepted = findAcceptedCountry(phone);
      if (accepted && countryByIso[accepted.iso]) return countryByIso[accepted.iso];
      const p = String(phone || '').replace(/\s/g, '');
      for (const c of dialCodeSorted)if (p.startsWith(c.dial_code)) return c;
      return null;
    };
    // Processes one session end-to-end without touching the DB. A hard timeout
    // reports the stage it hung at, so one bad session never stalls the batch.
    async function processOneSession(raw) {
      // A session may arrive as a plain string, or as { session, password } when
      // the archive shipped the account's existing 2FA password alongside it.
      const item = raw && typeof raw === 'object' ? raw : {
        session: raw,
        password: ''
      };
      const knownPassword = String(item.password || '');
      const rawTrimmed = String(item.session || '').trim();
      if (!rawTrimmed) {
        return {
          ok: false,
          failure: {
            reason: 'Empty session string',
            phone: '',
            session: ''
          }
        };
      }
      let sessionString;
      try {
        sessionString = normalizeSessionInput(rawTrimmed);
      } catch (e) {
        return {
          ok: false,
          failure: {
            reason: `Format error: ${e?.message || e}`,
            phone: '',
            session: rawTrimmed
          }
        };
      }
      let mt;
      let stage = 'connect';
      const parsedUp = parseSessionString(sessionString);
      const sessionInfo = parsedUp ? {
        authKey: parsedUp.authKey,
        dcId: parsedUp.dcId,
        port: 443,
        serverAddress: ''
      } : {};
      async function doProcess() {
        if (!parsedUp) throw {
          skip: true,
          reason: 'Session key could not be read',
          phone: ''
        };
        stage = 'getMe';
        mt = new Mt(sessionString);
        let phone = '';
        try {
          const me = await mt.getMe();
          if (me?.phone) phone = '+' + String(me.phone).replace(/^\+/, '');
        } catch (e) {
          throw {
            skip: true,
            reason: `Session not authorized / invalid (${errorMessageOf(e)})`,
            phone: '',
            ...sessionInfo
          };
        }
        const country = phone ? detectCountryLocal(phone) : null;
        if (!country) throw {
          skip: true,
          reason: 'Country not detected / not accepted',
          phone,
          ...sessionInfo
        };
        const rewardInfo = rewardMap[country.iso];
        let rewardPrice = country.price;
        let rewardWaitHours = 12;
        if (rewardInfo) {
          if (rewardInfo.active === false) throw {
            skip: true,
            reason: 'Country disabled by admin',
            phone,
            ...sessionInfo
          };
          rewardPrice = rewardInfo.reward_price;
          rewardWaitHours = rewardInfo.reward_wait_hours;
        }
        stage = 'spamCheck';
        const spamCheck = await checkSpamBotStatus(mt);
        if (spamCheck.status !== 'clean') {
          throw {
            skip: true,
            reason: 'Account flagged by SpamBot (spam/frozen/restricted)',
            phone,
            ...sessionInfo
          };
        }
        stage = 'getPassword';
        const pwd = await mt.call('account.getPassword', {});
        if (pwd.has_password && !knownPassword) {
          throw {
            skip: true,
            reason: 'Account has existing 2FA — password required',
            phone,
            ...sessionInfo
          };
        }
        const storedPassword = generatePassword(12);
        stage = pwd.has_password ? 'replace2FA' : 'set2FA';
        try {
          await setTwoFactorPassword(mt, storedPassword, pwd.has_password ? knownPassword : '');
        } catch (e) {
          if (pwd.has_password) {
            throw {
              skip: true,
              reason: `Existing 2FA password wrong / could not be replaced (${errorMessageOf(e)})`,
              phone,
              ...sessionInfo
            };
          }
          throw e;
        }
        const finalSession = await mt.save();
        const fallbackPhone = `+${(country.dial_code || '').replace(/^\+/, '')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        return {
          ok: true,
          phone: phone || fallbackPhone,
          countryIso: country.iso,
          price: country.price,
          reward: rewardPrice,
          rewardWaitHours,
          sessionString: finalSession,
          password: storedPassword
        };
      }
      try {
        return await Promise.race([
          doProcess(),
          new Promise((_, rej)=>setTimeout(()=>rej({
                skip: true,
                reason: `Timed out at ${stage}`,
                phone: '',
                ...sessionInfo
              }), 45000))
        ]);
      } catch (e) {
        if (e && e.skip) {
          return {
            ok: false,
            failure: {
              reason: e.reason,
              phone: e.phone || '',
              session: sessionString,
              authKey: e.authKey,
              dcId: e.dcId,
              port: e.port,
              serverAddress: e.serverAddress
            }
          };
        }
        return {
          ok: false,
          failure: {
            reason: errorMessageOf(e),
            phone: '',
            session: sessionString,
            ...sessionInfo
          }
        };
      }
    }
    // 8 parallel connections — higher values trigger Telegram rate-limiting.
    const CONCURRENCY = 8;
    const procResults = new Array(sessions.length);
    let nextIndex = 0;
    async function worker() {
      while(nextIndex < sessions.length){
        const i = nextIndex++;
        procResults[i] = await processOneSession(sessions[i]);
      }
    }
    await Promise.all(Array.from({
      length: Math.min(CONCURRENCY, sessions.length)
    }, worker));
    // Transient failures are retried — a healthy account must not be written
    // off for one slow handshake. Stops once a round rescues nothing new.
    const isTransient = (reason = '')=>/timed out|timeout|network|connect|socket|handshake|ECONN|closed/i.test(reason);
    let prevTransient = Infinity;
    for(let round = 0;; round++){
      const retryIdx = [];
      for(let i = 0; i < procResults.length; i++){
        const r = procResults[i];
        if (r && !r.ok && isTransient(r.failure?.reason)) retryIdx.push(i);
      }
      if (!retryIdx.length) break;
      if (retryIdx.length >= prevTransient && round > 0) break;
      prevTransient = retryIdx.length;
      let rc = 0;
      const retryWorker = async ()=>{
        while(rc < retryIdx.length){
          const i = retryIdx[rc++];
          procResults[i] = await processOneSession(sessions[i]);
        }
      };
      await Promise.all(Array.from({
        length: Math.min(10, retryIdx.length)
      }, retryWorker));
    }
    const successData = [];
    const failedDetails = [];
    const addedByCountry = {};
    const results = [];
    for (const r of procResults){
      if (r.ok) {
        successData.push(r);
        addedByCountry[r.countryIso] = (addedByCountry[r.countryIso] || 0) + 1;
        results.push({
          ok: true,
          phone: r.phone,
          country: r.countryIso,
          reward: r.reward
        });
      } else {
        const f = r.failure;
        failedDetails.push({
          reason: f.reason,
          phone: f.phone || '',
          session: f.session || '',
          authKey: f.authKey,
          dcId: f.dcId,
          port: f.port,
          serverAddress: f.serverAddress
        });
        results.push({
          ok: false,
          error: f.reason,
          phone: f.phone || ''
        });
      }
    }
    // Bulk DB writes — 2 calls total instead of 2 per session.
    let createdAccounts = [];
    if (successData.length) {
      const accountRecords = successData.map((s)=>({
          country_iso: s.countryIso,
          phone_number: s.phone,
          price: s.price,
          session_string: s.sessionString,
          password: s.password,
          status: 'available'
        }));
      try {
        createdAccounts = await base44.asServiceRole.entities.TgAccount.bulkCreate(accountRecords);
      } catch (e) {
        for (const rec of accountRecords){
          try {
            createdAccounts.push(await base44.asServiceRole.entities.TgAccount.create(rec));
          } catch (_) {}
        }
      }
    }
    // Admin uploads must not create any reward record.
    if (createdAccounts.length && !isAdminUpload) {
      const now = Date.now();
      const sessionRecords = createdAccounts.map((acc, i)=>{
        const s = successData[i];
        return {
          phone_number: s.phone,
          user_email: email,
          country_iso: s.countryIso,
          api_id: String(API_ID),
          api_hash: API_HASH,
          status: 'completed',
          session_string: s.sessionString,
          reward_status: 'pending',
          reward_eligible_at: new Date(now + s.rewardWaitHours * 60 * 60 * 1000).toISOString(),
          reward_amount: s.reward,
          account_id: acc?.id || ''
        };
      });
      try {
        await base44.asServiceRole.entities.SessionRequest.bulkCreate(sessionRecords);
      } catch (e) {
        for (const rec of sessionRecords){
          try {
            await base44.asServiceRole.entities.SessionRequest.create(rec);
          } catch (_) {}
        }
      }
    }
    const uniqueCountries = [
      ...new Set(successData.map((s)=>s.countryIso))
    ];
    await Promise.all(uniqueCountries.map((iso)=>syncCountryStock(base44, iso)));
    const added = successData.length;
    const failed = failedDetails.length;
    const totalReward = isAdminUpload ? 0 : successData.reduce((s, r)=>s + (r.reward || 0), 0);
    // Recovery ZIP of .session files for everything that failed.
    let failed_file_url = '';
    if (failedDetails.length) {
      const files = [];
      for(let i = 0; i < failedDetails.length; i++){
        const f = failedDetails[i];
        if (f.authKey && f.authKey.length) {
          files.push({
            name: f.phone ? `${f.phone.replace(/[^\d]/g, '')}.session` : `failed_${i + 1}.session`,
            data: buildSessionFile({
              authKey: f.authKey,
              dcId: f.dcId || 0,
              port: f.port || 443,
              serverAddress: f.serverAddress || ''
            })
          });
        } else {
          files.push({
            name: f.phone ? `${f.phone.replace(/[^\d]/g, '')}.txt` : `failed_${i + 1}.txt`,
            data: new TextEncoder().encode(`Phone: ${f.phone || 'unknown'}\nReason: ${f.reason}\nSession: ${f.session || '(none)'}`)
          });
        }
      }
      try {
        const zipFile = new File([
          createZip(files)
        ], `failed_sessions_${Date.now()}.zip`, {
          type: 'application/zip'
        });
        const up = await base44.asServiceRole.integrations.Core.UploadFile({
          file: zipFile
        });
        failed_file_url = up?.file_url || '';
      } catch (e) {}
    }
    return Response.json({
      success: true,
      total: results.length,
      added,
      failed,
      total_reward: totalReward,
      added_by_country: addedByCountry,
      results,
      failed_details: failedDetails.map(({ session, authKey, dcId, port, serverAddress, ...rest })=>rest),
      failed_file_url
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
