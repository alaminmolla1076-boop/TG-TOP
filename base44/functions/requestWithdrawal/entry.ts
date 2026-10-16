import { callB44 } from "../../shared/supabase.ts";

// Requests a balance withdrawal through the existing Supabase b44fn function
// (requestWithdrawal), which verifies the Telegram signature, debits the
// balance and creates a pending withdrawal for admin review.
// Requires a real Telegram user.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.initData) {
      return Response.json({ error: 'Open the app from Telegram to withdraw' }, { status: 400 });
    }
    const amount = Number(body.amount);
    const walletAddress = String(body.wallet_address || '').trim();
    const network = String(body.network || 'TRC20');
    if (!amount || amount <= 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });
    if (!walletAddress || walletAddress.length < 10) {
      return Response.json({ error: 'Please enter a valid wallet address' }, { status: 400 });
    }
    if (!['BEP20', 'POLYGON', 'TON'].includes(network)) {
      return Response.json({ error: 'Invalid network' }, { status: 400 });
    }

    const res = await callB44('requestWithdrawal', {
      initData: body.initData,
      amount,
      wallet_address: walletAddress,
      address: walletAddress,
      network,
      coin: network === 'TON' ? 'TON' : 'USDT',
    });
    const withdrawal = res.withdrawal || res.request || res.data || {};
    let balance = res.balance;
    if (balance === undefined || balance === null) {
      balance = (await callB44('getBalance', { initData: body.initData })).balance;
    }
    return Response.json({ withdrawal, balance: Number(balance) || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}