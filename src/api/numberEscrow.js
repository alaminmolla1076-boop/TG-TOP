// +888 number on-chain escrow client.
// Each step is a small call to the `numescrow` edge function, which verifies
// the Telegram initData, holds the buyer's balance, collects the seller's
// on-chain transaction hash and lets an admin release the sale.
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
    res = await fetch(`${SUPABASE_URL}/functions/v1/numescrow/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, init_data: initData() }),
    });
  } catch (e) {
    const error = new Error(e?.message || "Network error \u2014 check your connection");
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

export const createNumberOrder = (listingId) => call("order", { listing_id: listingId });
export const setNumberOrderAddress = (orderId, address) => call("setAddress", { order_id: orderId, address });
export const cancelNumberOrder = (orderId) => call("cancel", { order_id: orderId });
export const getMyNumberOrders = () => call("myOrders");
export const getSellerNumberOrders = () => call("sellerOrders");
export const submitNumberTransferTx = (orderId, txHash) => call("submitTx", { order_id: orderId, tx_hash: txHash });
export const getNumberEscrowQueue = () => call("adminQueue");
export const reviewNumberEscrow = (orderId, approve, note) => call("adminReview", { order_id: orderId, approve, note });
export const tonviewerTx = (hash) => `https://tonviewer.com/transaction/${hash}`;
