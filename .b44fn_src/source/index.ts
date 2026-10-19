import { setRegistry, getHandler, listFunctions } from './_shared/registry.ts';
import getPublicSettings from './fns/getPublicSettings.ts';
import getBalance from './fns/getBalance.ts';
import submitManualTopUp from './fns/submitManualTopUp.ts';
import requestWithdrawal from './fns/requestWithdrawal.ts';
import approveTopUp from './fns/approveTopUp.ts';
import approveWithdrawal from './fns/approveWithdrawal.ts';
import addUserBalance from './fns/addUserBalance.ts';
import banUser from './fns/banUser.ts';
import createOkpayOrder from './fns/createOkpayOrder.ts';
import okpayCallback from './fns/okpayCallback.ts';
import checkOkpayOrder from './fns/checkOkpayOrder.ts';
import purchaseProduct from './fns/purchaseProduct.ts';
import getMarketSellers from './fns/getMarketSellers.ts';
import getMyMoneyRecords from './fns/getMyMoneyRecords.ts';
import getMyStats from './fns/getMyStats.ts';
import getMySessions from './fns/getMySessions.ts';
import processSellSeasonJobs from './fns/processSellSeasonJobs.ts';
import pollTelegramUpdates from './fns/pollTelegramUpdates.ts';
import getAdminData from './fns/getAdminData.ts';
import telegramWebAppAuth from './fns/telegramWebAppAuth.ts';
import updateRewardPrice from './fns/updateRewardPrice.ts';
import sendBotMessage from './fns/sendBotMessage.ts';
import submitTelegramUsername from './fns/submitTelegramUsername.ts';
import getMyAdminStatus from './fns/getMyAdminStatus.ts';
import getTelegramBotInfo from './fns/getTelegramBotInfo.ts';
import setupTelegramWebhook from './fns/setupTelegramWebhook.ts';
import enforceAdminRoles from './fns/enforceAdminRoles.ts';
import topUpRequest from './fns/topUpRequest.ts';
// Web-API handlers — the frontend (Vercel-hosted) calls these directly under
// /functions/v1/b44fn/web<Name>. Byte-for-byte ports of the previous
// Base44-hosted functions; business logic lives in the same place as the bot.
import webGetMyData from './webfns/getMyData.ts';
import webGetMarketProducts from './webfns/getMarketProducts.ts';
import webTelegramAuth from './webfns/telegramAuth.ts';
import webAdminData from './webfns/adminData.ts';
import webAdminUsers from './webfns/adminUsers.ts';
import webAdminUserAction from './webfns/adminUserAction.ts';
import webAdminUserHistory from './webfns/adminUserHistory.ts';
import webGetPurchases from './webfns/getPurchases.ts';
import webGetAccountCode from './webfns/getAccountCode.ts';
import webBuySession from './webfns/buySession.ts';
import webBuyProduct from './webfns/buyProduct.ts';
import webSetStockPrice from './webfns/setStockPrice.ts';
import webReportSeller from './webfns/reportSeller.ts';
import webSellSendCode from './webfns/sellSendCode.ts';
import webSellVerifyCode from './webfns/sellVerifyCode.ts';
import webDownloadSessions from './webfns/downloadSessions.ts';
import webCreateOkpayOrder from './webfns/createOkpayOrder.ts';
import webCheckOkpayOrder from './webfns/checkOkpayOrder.ts';
import webRequestWithdrawal from './webfns/requestWithdrawal.ts';
import webReviewTopUp from './webfns/reviewTopUp.ts';
import webReviewWithdrawal from './webfns/reviewWithdrawal.ts';
import webTonTopUp from './webfns/tonTopUp.ts';
import webVerifyUsdtDeposit from './webfns/verifyUsdtDeposit.ts';
import webPing from './webfns/ping.ts';
// Heavy MTProto/session functions are imported lazily (see the arrow handlers
// below) so simple bot replies never pay their multi-megabyte startup cost.
// Single Supabase Edge Function hosting every ported backend function.
// Called as POST /functions/v1/b44fn/<functionName> with a JSON body, which is
// exactly how base44.functions.invoke(name, payload) behaves.
setRegistry({
  getPublicSettings,
  getBalance,
  submitManualTopUp,
  requestWithdrawal,
  approveTopUp,
  approveWithdrawal,
  addUserBalance,
  banUser,
  createOkpayOrder,
  okpayCallback,
  checkOkpayOrder,
  purchaseProduct,
  getMarketSellers,
  getMyMoneyRecords,
  getMyStats,
  getMySessions,
  purchaseAccount: (req)=>import('./fns/purchaseAccount.ts').then((m)=>m.default(req)),
  fetchOtpCode: (req)=>import('./fns/fetchOtpCode.ts').then((m)=>m.default(req)),
  sendLoginCode: (req)=>import('./fns/sendLoginCode.ts').then((m)=>m.default(req)),
  verifyLoginCode: (req)=>import('./fns/verifyLoginCode.ts').then((m)=>m.default(req)),
  uploadSessions: (req)=>import('./fns/uploadSessions.ts').then((m)=>m.default(req)),
  sellSeason: (req)=>import('./fns/sellSeason.ts').then((m)=>m.default(req)),
  generateSeasonZip: (req)=>import('./fns/generateSeasonZip.ts').then((m)=>m.default(req)),
  processSellSeasonJobs,
  updateSellerPrice: (req)=>import('./fns/updateSellerPrice.ts').then((m)=>m.default(req)),
  processPendingRewards: (req)=>import('./fns/processPendingRewards.ts').then((m)=>m.default(req)),
  verifyStockAccounts: (req)=>import('./fns/verifyStockAccounts.ts').then((m)=>m.default(req)),
  pollTelegramUpdates,
  getAdminData,
  telegramWebAppAuth,
  updateRewardPrice,
  sendBotMessage,
  submitTelegramUsername,
  getMyAdminStatus,
  getTelegramBotInfo,
  setupTelegramWebhook,
  enforceAdminRoles,
  topUpRequest,
  webGetMyData,
  webGetMarketProducts,
  webTelegramAuth,
  webAdminData,
  webAdminUsers,
  webAdminUserAction,
  webAdminUserHistory,
  webGetPurchases,
  webGetAccountCode,
  webBuySession,
  webBuyProduct,
  webSetStockPrice,
  webReportSeller,
  webSellSendCode,
  webSellVerifyCode,
  webDownloadSessions,
  webCreateOkpayOrder,
  webCheckOkpayOrder,
  webRequestWithdrawal,
  webReviewTopUp,
  webReviewWithdrawal,
  webTonTopUp,
  webVerifyUsdtDeposit,
  webPing
});
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-tg-init-data, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};
function withCors(res) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS))headers.set(k, v);
  return new Response(res.body, {
    status: res.status,
    headers
  });
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  const name = new URL(req.url).pathname.split('/').filter(Boolean).pop() || '';
  if (!name || name === 'b44fn') {
    return withCors(Response.json({
      functions: listFunctions()
    }));
  }
  const handler = getHandler(name);
  if (!handler) {
    return withCors(Response.json({
      error: `Unknown function "${name}"`
    }, {
      status: 404
    }));
  }
  // `x-internal-call` may only be set by in-process calls — strip it from any
  // incoming public request so nobody can claim service-role privileges.
  const headers = new Headers(req.headers);
  const cronSecret = Deno.env.get('CRON_SECRET') || '';
  const isCron = !!cronSecret && headers.get('x-cron-secret') === cronSecret;
  headers.delete('x-internal-call');
  headers.delete('x-cron-secret');
  // Scheduled pg_cron runs present a shared secret and act with service-role
  // privileges, exactly like an internal function-to-function call.
  if (isCron) headers.set('x-internal-call', '1');
  const safeReq = new Request(req.url, {
    method: req.method,
    headers,
    body: req.body
  });
  try {
    return withCors(await handler(safeReq));
  } catch (error) {
    return withCors(Response.json({
      error: error.message
    }, {
      status: 500
    }));
  }
});