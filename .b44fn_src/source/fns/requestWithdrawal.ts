import { makeB44 } from '../_shared/b44.ts';
import { admin } from '../_shared/entities.ts';
import { notifyOnce } from '../_shared/adminNotify.ts';
import { resolveUser } from '../_shared/resolveUser.ts';
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
    const amount = Number(body.amount);
    const network = String(body.network || 'BEP20').toUpperCase();
    const address = String(body.wallet_address || '').trim();
    if (!Number.isFinite(amount) || amount < 3 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
      return Response.json({
        error: 'Minimum withdrawal is $3; use at most two decimal places'
      }, {
        status: 400
      });
    }
    if (![
      'BEP20',
      'POLYGON',
      'TON'
    ].includes(network)) return Response.json({
      error: 'Invalid withdrawal network'
    }, {
      status: 400
    });
    const validAddress = network === 'TON' ? /^(EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}$/.test(address) || /^(0|-1):[a-fA-F0-9]{64}$/.test(address) : /^0x[a-fA-F0-9]{40}$/.test(address);
    if (!validAddress) return Response.json({
      error: 'Invalid wallet address for the selected network'
    }, {
      status: 400
    });
    const { data, error } = await admin.rpc('create_wallet_withdrawal', {
      p_email: user.email,
      p_amount: amount,
      p_wallet_address: address,
      p_network: network
    });
    if (error) return Response.json({
      error: error.message
    }, {
      status: 400
    });
    try {
      await notifyOnce(base44, user.email, `Withdrawal submitted\n\nAmount: $${amount.toFixed(2)} USD equivalent\nNetwork: ${network}\nAddress: ${address}\nStatus: Pending`);
    } catch (notificationError) {
      console.error('Withdrawal notification failed', notificationError.message);
    }
    return Response.json({
      success: true,
      amount,
      withdrawal: data.withdrawal,
      balance: data.balance,
      newBalance: data.balance
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
