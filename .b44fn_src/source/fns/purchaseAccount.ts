import { makeB44, secrets } from '../_shared/b44.ts';
import { admin } from '../_shared/entities.ts';
import { deliverSeasonZip } from '../bot/delivery.ts';
import { getRealBalance } from '../_shared/balance.ts';
import { getAvailableAccounts, syncCountryStock } from '../_shared/inventory.js';
import { readOtpFromSession } from '../_shared/readOtp.js';
import { clearTwoFactorGuaranteed } from '../_shared/twoFactor.js';
import { resolveUser } from '../_shared/resolveUser.ts';
// Direct port of base44/functions/purchaseAccount — same budget/concurrency
// tuning, so large seasons keep completing in the same chunked way.
const BUDGET_MS = 180000;
const CONCURRENCY = 8;
const WAVE = 40;
export default async function(req) {
  const startedAt = Date.now();
  try {
    const base44 = makeB44(req);
    const body = await req.json().catch(()=>({}));
    const user = await resolveUser(base44, body);
    if (!user) return Response.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
    const { country_iso, quantity, owner_email, mode } = body;
    const qty = quantity == null ? 1 : Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 3000) return Response.json({
      error: 'Quantity must be a whole number between 1 and 3000'
    }, {
      status: 400
    });
    // P2P: the seller's account carries its own price, so a Country catalog
    // record is optional — only used as a price fallback and for stock sync.
    const countries = await base44.asServiceRole.entities.Country.filter({
      iso: country_iso
    }).catch(()=>[]);
    const country = countries.find((c)=>c.platform === 'tg' || !c.platform) || countries[0] || null;
    // Pull spares so accounts whose 2FA cannot be cleared can be swapped out.
    // When owner_email is given, buy from that specific seller — so the buyer
    // pays the seller's own price (per-seller pricing).
    const stockBuffer = await getAvailableAccounts(base44, country_iso, qty * 3, owner_email || null);
    if (stockBuffer.length < qty) {
      return Response.json({
        error: 'Out of stock — no available numbers for this country',
        available: stockBuffer.length
      }, {
        status: 400
      });
    }
    // Use the seller's own price (stored on each account) — falls back to the
    // global country price only for legacy accounts without a per-seller price.
    const unitPrice = Number(stockBuffer[0]?.price) || Number(country?.price) || 0;
    const accountPrice = (acc)=>Number((Number(acc.price) || unitPrice).toFixed(2));
    const total = Number(stockBuffer.slice(0, qty).reduce((sum, acc)=>sum + accountPrice(acc), 0).toFixed(2));
    const realBalance = await getRealBalance(base44, user.email);
    if (realBalance < total) {
      return Response.json({
        error: 'Insufficient balance'
      }, {
        status: 400
      });
    }
    const isSeason = qty > 1;
    const batchId = body.batch_id || (isSeason ? `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : '');
    const delivered = [];
    const rejected = [];
    let cursor = 0;
    let outOfTime = false;
    let settledBalance = realBalance;
    const commit = async (batch)=>{
      if (!batch.length) return;
      const { data, error } = await admin.rpc('complete_account_purchase', {
        p_buyer_email: user.email,
        p_items: batch.map((acc)=>({
            id: acc.id,
            price: accountPrice(acc)
          })),
        p_purchase_type: isSeason ? 'season' : 'single',
        p_batch_id: batchId || null
      });
      if (error) throw new Error(error.message);
      settledBalance = Number(data.new_balance);
    };
    let pending = [];
    while(delivered.length < qty && cursor < stockBuffer.length && !outOfTime){
      const target = Math.min(qty, delivered.length + WAVE);
      pending = [];
      const lanes = Math.min(CONCURRENCY, target - delivered.length);
      await Promise.all(Array.from({
        length: lanes
      }, async ()=>{
        while(delivered.length + pending.length < target && cursor < stockBuffer.length){
          if (Date.now() - startedAt > BUDGET_MS) {
            outOfTime = true;
            return;
          }
          const acc = stockBuffer[cursor++];
          let ok = false;
          try {
            ok = await clearTwoFactorGuaranteed(acc.session_string, acc.password || '');
          } catch  {
            ok = false;
          }
          if (ok) pending.push(acc);
          else rejected.push(acc.phone_number);
        }
      }));
      const wave = pending.slice(0, qty - delivered.length);
      try {
        await commit(wave);
      } catch (commitError) {
        if (!delivered.length) return Response.json({
          error: commitError.message
        }, {
          status: 400
        });
        break;
      }
      delivered.push(...wave);
      if (!wave.length) break;
    }
    if (delivered.length === 0) {
      return Response.json({
        error: 'No account could be verified 2FA-free right now. Nothing was charged — please try again.',
        rejected_count: rejected.length
      }, {
        status: 400
      });
    }
    // Auto-read the login code only for single purchases.
    if (!isSeason) {
      const acc = delivered[0];
      let code = '';
      try {
        const otp = await readOtpFromSession(acc.session_string);
        if (otp) code = otp.code;
      } catch  {}
      if (code) {
        await base44.asServiceRole.entities.OtpRequest.create({
          account_id: acc.id,
          user_email: user.email,
          phone_number: acc.phone_number,
          country_iso: country_iso,
          otp_code: code,
          pass: '',
          status: 'fulfilled'
        }).catch((error)=>console.error('OTP receipt failed', error.message));
      }
    }
    if (country) await syncCountryStock(base44, country_iso).catch((error)=>console.error('Stock refresh failed', error.message));
    // Deliver session file(s) to the buyer's bot chat ONLY for "session" mode.
    // "single" mode (Buy 1) just returns the phone — the user fetches OTP manually.
    let zip_delivered = false;
    let zip_error = null;
    const deliveryHandledByBot = base44.__internal && body.purchase_type === 'season';
    if (mode === 'session' && delivered.length >= 1 && !deliveryHandledByBot) {
      try {
        const idMatch = /^tg(\d+)@telegram\.local$/i.exec(user.email || '');
        const telegramId = user.telegram_id || (idMatch ? idMatch[1] : null);
        const botToken = secrets.get('TELEGRAM_BOT_TOKEN');
        if (!telegramId || !botToken) {
          zip_error = telegramId ? 'Bot token not configured' : 'Telegram account not bound';
        } else {
          const sent = await deliverSeasonZip(base44, botToken, telegramId, delivered.map((acc)=>acc.id));
          zip_delivered = sent === delivered.length;
          if (!zip_delivered) zip_error = 'Not all sessions could be delivered';
        }
      } catch (e) {
        zip_error = e.message || String(e);
      }
    }
    return Response.json({
      success: true,
      balance: settledBalance,
      first_account_id: delivered[0].id,
      phone: delivered[0].phone_number,
      account_ids: delivered.map((a)=>a.id),
      delivered: delivered.length,
      requested: qty,
      remaining: Math.max(0, qty - delivered.length),
      partial: delivered.length < qty,
      batch_id: batchId,
      rejected_count: rejected.length,
      zip_delivered,
      zip_error
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
