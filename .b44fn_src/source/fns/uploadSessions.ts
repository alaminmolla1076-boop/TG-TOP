import { makeB44 } from '../_shared/b44.ts';
import { isAdminRequest } from '../_shared/isAdmin.ts';
import { Mt, errorMessageOf } from '../_shared/mtproto.js';
import { generatePassword, setTwoFactorPassword } from '../_shared/twoFactor.js';
import { syncCountryStock } from '../_shared/inventory.js';
import { normalizeSessionInput } from '../_shared/sessionParser.js';
import { checkSpamBotStatus } from '../_shared/spamBot.js';
// Admin bulk-uploads Telegram StringSession strings for a chosen country.
// Each session is connected, checked against @SpamBot, given a system 2FA
// password, then stored as available inventory. Anything that fails validation
// never enters stock and is written into a downloadable failure log.
export default async function(req) {
  try {
    const base44 = makeB44(req);
    if (!await isAdminRequest(base44)) {
      return Response.json({
        error: 'Admin only'
      }, {
        status: 403
      });
    }
    const { country_iso, sessions, password } = await req.json();
    if (!country_iso || !Array.isArray(sessions) || sessions.length === 0) {
      return Response.json({
        error: 'country_iso and sessions[] required'
      }, {
        status: 400
      });
    }
    const countries = await base44.asServiceRole.entities.Country.filter({
      iso: country_iso
    });
    const country = countries[0];
    if (!country) return Response.json({
      error: 'Country not found'
    }, {
      status: 404
    });
    const providedPassword = (password || '').trim();
    const results = [];
    const failedDetails = [];
    const addFailure = (reason, phone, sessionString)=>{
      failedDetails.push({
        reason,
        phone: phone || '',
        session: sessionString || ''
      });
      results.push({
        ok: false,
        error: reason,
        phone: phone || ''
      });
    };
    for (const raw of sessions){
      const rawTrimmed = String(raw || '').trim();
      if (!rawTrimmed) {
        addFailure('Empty session string', '', '');
        continue;
      }
      let sessionString;
      try {
        sessionString = normalizeSessionInput(rawTrimmed);
      } catch (e) {
        addFailure(`Format error: ${e?.message || e}`, '', rawTrimmed);
        continue;
      }
      try {
        const mt = new Mt(sessionString);
        // Reading the phone from the account also proves the session works.
        let phone = '';
        try {
          const me = await mt.getMe();
          if (me?.phone) phone = '+' + String(me.phone).replace(/^\+/, '');
        } catch (e) {
          addFailure(`Session not authorized / invalid (${errorMessageOf(e)})`, '', sessionString);
          continue;
        }
        const spamCheck = await checkSpamBotStatus(mt);
        if (spamCheck.status !== 'clean') {
          addFailure('Account flagged by SpamBot (spam/frozen/restricted)', phone, sessionString);
          continue;
        }
        let storedPassword = '';
        try {
          const pwd = await mt.call('account.getPassword', {});
          if (pwd.has_password) {
            if (!providedPassword) {
              addFailure('Account has existing 2FA — password required', phone, sessionString);
              continue;
            }
            storedPassword = providedPassword;
          } else {
            storedPassword = generatePassword(12);
            await setTwoFactorPassword(mt, storedPassword, '');
          }
        } catch (e) {
          addFailure(`2FA setup failed: ${errorMessageOf(e)}`, phone, sessionString);
          continue;
        }
        const finalSession = await mt.save();
        const fallbackPhone = `+${(country.dial_code || '').replace(/^\+/, '')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await base44.asServiceRole.entities.TgAccount.create({
          country_iso,
          phone_number: phone || fallbackPhone,
          price: country.price,
          session_string: finalSession,
          password: storedPassword,
          status: 'available'
        });
        results.push({
          ok: true,
          phone: phone || 'unknown'
        });
      } catch (e) {
        addFailure(errorMessageOf(e), '', sessionString);
      }
    }
    await syncCountryStock(base44, country_iso);
    const added = results.filter((r)=>r.ok).length;
    const failed = results.length - added;
    let failed_file_url = '';
    let failed_log_url = '';
    if (failedDetails.length) {
      const tally = {};
      for (const f of failedDetails)tally[f.reason] = (tally[f.reason] || 0) + 1;
      const summaryLines = Object.entries(tally).map(([reason, count])=>`  • ${reason}: ${count}`).join('\n');
      const detailLines = failedDetails.map((f, i)=>{
        const phonePart = f.phone ? `Phone: ${f.phone}\n    ` : '';
        return `[${i + 1}] Reason: ${f.reason}\n    ${phonePart}Session: ${f.session || '(none)'}`;
      }).join('\n\n');
      const logText = `Failed Sessions Log\n` + `Country: ${country_iso} (${country.name})\n` + `Generated: ${new Date().toISOString()}\n` + `Total: ${results.length} | Added: ${added} | Failed: ${failed}\n\n` + `Summary by reason:\n${summaryLines}\n\n` + `Detailed list:\n\n${detailLines}\n`;
      try {
        const file = new File([
          new Blob([
            logText
          ], {
            type: 'text/plain'
          })
        ], `failed_sessions_${country_iso}.txt`, {
          type: 'text/plain'
        });
        const up = await base44.asServiceRole.integrations.Core.UploadFile({
          file
        });
        failed_log_url = up?.file_url || '';
        failed_file_url = failed_log_url;
      } catch (e) {}
    }
    return Response.json({
      success: true,
      country: country_iso,
      country_name: country.name,
      total: results.length,
      added,
      failed,
      results,
      failed_details: failedDetails,
      failed_file_url,
      failed_log_url
    });
  } catch (error) {
    return Response.json({
      error: error.message || String(error)
    }, {
      status: 500
    });
  }
}
