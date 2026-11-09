// VIP / +888 numbers live outside the b44fn router: one small edge function
// (viptop) owns them, because each number is a single listing with its own
// price instead of a country-wide stock price.
const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || "https://kiglmpxkilgwzkuewuvb.supabase.co"
).replace(/\/+$/, "");

function initData() {
  return (typeof window !== "undefined" && window.Telegram?.WebApp?.initData) || "";
}

async function call(action, payload = {}) {
  if (!initData()) {
    const error = new Error("Open the app from Telegram");
    error.response = { data: { error: error.message } };
    throw error;
  }
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/viptop/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, init_data: initData() }),
    });
  } catch (e) {
    const error = new Error(e?.message || "Network error — check your connection");
    error.response = { data: { error: error.message } };
    throw error;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.response = { data };
    throw error;
  }
  return data;
}

export const markNumberKind = (phoneNumber, kind) => call("mark", { phone_number: phoneNumber, kind });
export const setNumberPrice = (accountId, price) => call("setPrice", { account_id: accountId, price });
export const getMyNumbers = () => call("myNumbers").then((data) => data.numbers || []);
export const getSellerNumbers = (sellerEmail) => call("list", { seller_email: sellerEmail });
export const buyNumber = (accountId) => call("buy", { account_id: accountId });
export const getMyNumberPasswords = () => call("myPasswords").then((data) => data.passwords || []);
