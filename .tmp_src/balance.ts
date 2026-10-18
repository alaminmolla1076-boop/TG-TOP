// Authoritative balance computed from source-of-truth records.
// Logic is a direct port of base44/shared/balance.js — unchanged behaviour.
export async function getRealBalance(base44, userEmail) {
  if (!userEmail) return 0;
  const topups = await base44.asServiceRole.entities.TopUp.filter({
    user_email: userEmail,
    status: 'approved'
  });
  const credited = topups.reduce((s, t)=>s + Number(t.amount || 0), 0);
  const orders = await base44.asServiceRole.entities.ProductOrder.filter({
    user_email: userEmail,
    status: 'completed'
  });
  const debitedProducts = orders.reduce((s, o)=>s + Number(o.price || 0), 0);
  const accounts = await base44.asServiceRole.entities.TgAccount.filter({
    owner_email: userEmail,
    status: 'sold'
  });
  const debitedAccounts = accounts.reduce((s, a)=>s + Number(a.price || 0), 0);
  // Pending and approved withdrawals are both held, so the amount is reserved
  // as soon as the user requests it.
  const withdrawals = await base44.asServiceRole.entities.Withdrawal.filter({
    user_email: userEmail,
    status: {
      $in: [
        'pending',
        'approved'
      ]
    }
  });
  const debitedWithdrawals = withdrawals.reduce((s, w)=>s + Number(w.amount || 0), 0);
  return Number((credited - debitedProducts - debitedAccounts - debitedWithdrawals).toFixed(2));
}
export async function syncUserBalance(base44, userEmail) {
  const realBalance = await getRealBalance(base44, userEmail);
  const users = await base44.asServiceRole.entities.User.filter({
    email: userEmail
  });
  if (users[0] && Number(users[0].balance || 0) !== realBalance) {
    await base44.asServiceRole.entities.User.update(users[0].id, {
      balance: realBalance
    });
  }
  return realBalance;
}
export async function creditSessionReward(base44, userEmail, amount) {
  const amt = Number(amount);
  if (!userEmail || !amt) return;
  await base44.asServiceRole.entities.TopUp.create({
    user_email: userEmail,
    amount: amt,
    coin: 'USDT',
    network: 'session_reward',
    status: 'approved'
  });
  return await syncUserBalance(base44, userEmail);
}
