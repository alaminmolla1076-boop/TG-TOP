import { makeB44 } from '../_shared/b44.ts';
import { notifyOnce } from '../_shared/adminNotify.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
// Creates a manual (pending) TopUp record from the frontend.
// Status is ALWAYS forced to 'pending' — never trusts client-provided status.
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
    const { amount, coin, network, tx_hash } = body;
    const amt = Number(amount);
    if (!amt || amt <= 0) return Response.json({
      error: 'Invalid amount'
    }, {
      status: 400
    });
    if (amt < 1 || amt > 1000) return Response.json({
      error: 'Amount must be between $1 and $1000'
    }, {
      status: 400
    });
    if (!tx_hash || tx_hash.trim().length < 5) return Response.json({
      error: 'Transaction hash required'
    }, {
      status: 400
    });
    const coinCode = (coin || 'USDT').toUpperCase();
    // Force status = 'pending' — admin must approve before balance is credited.
    await base44.asServiceRole.entities.TopUp.create({
      amount: amt,
      coin: coinCode,
      network: network || '',
      tx_hash: tx_hash.trim(),
      status: 'pending',
      user_email: user.email
    });
    await notifyOnce(base44, user.email, `⏳ <b>Top Up Submitted</b>\n\nAmount: $${amt.toFixed(2)} ${coinCode}\nAddress/Tx: <code>${tx_hash.trim()}</code>\nStatus: Pending`);
    return Response.json({
      success: true,
      status: 'pending'
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
