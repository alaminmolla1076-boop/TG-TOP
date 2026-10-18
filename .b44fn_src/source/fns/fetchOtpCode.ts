import { makeB44 } from '../_shared/b44.ts';
import { readOtpFromSession } from '../_shared/readOtp.js';
import { resolveUser } from '../_shared/resolveUser.ts';
export default async function(req) {
  try {
    const base44 = makeB44(req);
    const body = await req.json().catch(()=>({}));
    const user = await resolveUser(base44, body);
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const { account_id } = body;
    const account = await base44.asServiceRole.entities.TgAccount.get(account_id);
    if (!account) return Response.json({
      error: 'Account not found'
    }, {
      status: 404
    });
    if (account.owner_email !== user.email && user.role !== 'admin') {
      return Response.json({
        error: 'Forbidden'
      }, {
        status: 403
      });
    }
    if (!account.session_string) {
      return Response.json({
        error: 'No session available for this account'
      }, {
        status: 400
      });
    }
    // Only a code Telegram delivered AFTER this purchase can be the buyer's;
    // older ones are the seller's stale login codes and always invalid.
    const sinceMs = account.updated_date ? new Date(account.updated_date).getTime() : 0;
    const otp = await readOtpFromSession(account.session_string, sinceMs);
    if (!otp || !otp.code) {
      return Response.json({
        error: 'No code yet — open Telegram, enter this number on the login screen to request a code, then tap Get Code again'
      }, {
        status: 400
      });
    }
    const otpRec = await base44.asServiceRole.entities.OtpRequest.create({
      account_id: account.id,
      user_email: user.email,
      phone_number: account.phone_number,
      country_iso: account.country_iso,
      otp_code: otp.code,
      pass: account.password || '',
      status: 'fulfilled'
    });
    return Response.json({
      success: true,
      otp_id: otpRec.id,
      code: otp.code,
      pass: account.password || ''
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}