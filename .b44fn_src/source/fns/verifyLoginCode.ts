import { makeB44 } from '../_shared/b44.ts';
import { Mt, errorMessageOf, srpCheck } from '../_shared/mtproto.js';
import { resolveUser } from '../_shared/resolveUser.ts';
import { findAcceptedCountry } from '../_shared/acceptedCountries.js';
import { generatePassword, setTwoFactorPassword } from '../_shared/twoFactor.js';
import { checkSpamBotStatus } from '../_shared/spamBot.js';
import { ageBucketOf } from '../_shared/accountAge.js';
// Verifies the Telegram OTP code, sets a system 2FA password, and adds the
// account to the SELLER'S OWN stock (TgAccount with owner_email = seller).
// No reward is created — the account simply goes to the user's inventory.
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
    const { request_id, phone_code, password, user_email } = body;
    if (!request_id) return Response.json({
      error: 'request_id required'
    }, {
      status: 400
    });
    if (!phone_code) return Response.json({
      error: 'phone_code required'
    }, {
      status: 400
    });
    const email = user_email || user.email;
    // Look up the stored session state from sendLoginCode.
    const sr = await base44.asServiceRole.entities.SessionRequest.get(String(request_id));
    if (!sr) return Response.json({
      error: 'Invalid or expired request'
    }, {
      status: 400
    });
    // A stored account only needs its own DC; do not create four extra
    // auth keys through the library's automatic authorization fan-out.
    mt = new Mt(sr.session_string || '', {
      syncAuth: false
    });
    // Verify the cloud password on a resumed request (the OTP was already
    // accepted). A wrong password keeps the request alive so the seller can
    // retry.
    if (sr.status === 'awaiting_2fa' && password) {
      try {
        const pwd = await mt.call('account.getPassword', {});
        const check = await srpCheck(pwd, String(password));
        await mt.call('auth.checkPassword', {
          password: check
        });
      } catch (e2) {
        return Response.json({
          error: errorMessageOf(e2)
        }, {
          status: 400
        });
      }
    } else {
      try {
        // A previous worker can stop after Telegram accepted the code.
        // Reuse that authorized key rather than consume the same OTP again.
        if (!await mt.isAuthorized()) {
          await mt.call('auth.signIn', {
            phone_number: sr.phone_number,
            phone_code_hash: sr.phone_code_hash,
            phone_code: String(phone_code).trim()
          });
        }
      } catch (e) {
        const msg = errorMessageOf(e);
        // Account has 2FA — ask for the password (or verify it now).
        if (/SESSION_PASSWORD_NEEDED/i.test(msg)) {
          if (!password) {
            // Code accepted: persist the 2FA-pending session so the next
            // call can run auth.checkPassword on the same auth key.
            const pendingSession = await mt.save();
            await base44.asServiceRole.entities.SessionRequest.update(sr.id, {
              status: 'awaiting_2fa',
              session_string: pendingSession
            });
            return Response.json({
              error: '2FA_REQUIRED'
            }, {
              status: 400
            });
          }
          try {
            const pwd = await mt.call('account.getPassword', {});
            const check = await srpCheck(pwd, String(password));
            await mt.call('auth.checkPassword', {
              password: check
            });
          } catch (e2) {
            return Response.json({
              error: errorMessageOf(e2)
            }, {
              status: 400
            });
          }
        } else {
          await base44.asServiceRole.entities.SessionRequest.update(sr.id, {
            status: 'failed',
            error: msg
          });
          return Response.json({
            error: msg
          }, {
            status: 400
          });
        }
      }
    }
    // Age check: when the seller picked an age bucket for this sale (web sell
    // flow), the account's real age — estimated from its Telegram user ID —
    // must match it. Refuse BEFORE anything is changed on the account.
    let meInfo = null;
    try { meInfo = await mt.getMe(); } catch {}
    const ageBucket = meInfo?.id ? ageBucketOf(meInfo.id) : 'regular';
    const requestedAge = body.age_selection ? String(body.age_selection) : '';
    if (requestedAge && requestedAge !== ageBucket) {
      await base44.asServiceRole.entities.SessionRequest.update(sr.id, {
        status: 'rejected',
        error: `Age mismatch: selected ${requestedAge}, account is ${ageBucket}`
      });
      return Response.json({ error: `AGE_MISMATCH:${ageBucket}` }, { status: 400 });
    }
    // Login succeeded — set (or replace with a system) 2FA password before saving.
    let storedPassword = '';
    try {
      const pwd = await mt.call('account.getPassword', {});
      if (pwd.has_password && !password) {
        // Already has 2FA and the old password is unknown — cannot rotate it.
        await base44.asServiceRole.entities.SessionRequest.update(sr.id, {
          status: 'rejected',
          error: 'Account already has 2FA — not supported'
        });
        return Response.json({
          error: 'Account already has 2FA — not supported'
        }, {
          status: 400
        });
      }
      storedPassword = generatePassword(12);
      // When the seller logged in with their own 2FA, replace it with the
      // system password; fresh accounts simply get the system password.
      await setTwoFactorPassword(mt, storedPassword, pwd.has_password ? String(password) : '', 'tgtop');
    } catch (e) {
      const msg = errorMessageOf(e);
      await base44.asServiceRole.entities.SessionRequest.update(sr.id, {
        status: 'failed',
        error: `2FA setup failed: ${msg}`
      });
      return Response.json({
        error: `2FA setup failed: ${msg}`
      }, {
        status: 500
      });
    }
    // Spam check right at login: start @SpamBot, read its verdict, and file the
    // account into the seller's Spam or Non-Spam stock based on it.
    const spamCheck = await checkSpamBotStatus(mt);
    const spam = spamCheck.status !== 'clean';
    const finalSession = await mt.save();
    let phone = sr.phone_number;
    try {
      const me = await mt.getMe();
      if (me?.phone) phone = '+' + String(me.phone).replace(/^\+/, '');
    } catch  {}
    const country = findAcceptedCountry(phone);
    const countryIso = country?.iso || '';
    const countryName = country?.flag ? `${country.flag}` : countryIso;
    // Add to the seller's own stock (owner_email = seller).
    const account = await base44.asServiceRole.entities.TgAccount.create({
      country_iso: countryIso,
      phone_number: phone,
      price: country?.price || 0,
      session_string: finalSession,
      password: storedPassword,
      status: 'available',
      owner_email: email,
      purchase_type: 'season',
      spam,
      age_category: ageBucket
    });
    await base44.asServiceRole.entities.SessionRequest.update(sr.id, {
      status: 'completed',
      session_string: finalSession,
      account_id: account?.id || ''
    });
    return Response.json({
      success: true,
      phone,
      country: countryName,
      country_iso: countryIso,
      spam,
      age_category: ageBucket
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