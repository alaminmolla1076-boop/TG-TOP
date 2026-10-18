// Base44 entity name -> Supabase table name.
// Kept identical to src/api/supabaseMaps.js so frontend and backend agree.
export const ENTITY_TABLE_MAP = {
  User: 'profiles',
  Country: 'countries',
  TgAccount: 'tg_accounts',
  RewardPrice: 'reward_prices',
  SessionRequest: 'session_requests',
  OtpRequest: 'otp_requests',
  TopUp: 'top_ups',
  Withdrawal: 'withdrawals',
  Product: 'products',
  ProductOrder: 'product_orders',
  BotState: 'bot_state',
  TgWebUser: 'tg_web_users'
};
// Public bucket that replaces Base44's Core.UploadFile storage.
export const PUBLIC_BUCKET = 'files';
