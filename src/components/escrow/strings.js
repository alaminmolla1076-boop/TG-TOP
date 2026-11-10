// Localised copy for the +888 on-chain escrow flow (en + bn; other languages
// fall back to English).
const STRINGS = {
  en: {
    note: "+888 numbers are Fragment NFTs. Your balance is held while the seller transfers the number to your TON wallet.",
    price: "Number price",
    fee: "Service fee (5%)",
    total: "You pay (held)",
    addressTitle: "Your TON wallet address",
    addressHint: "Paste the TON wallet (Tonkeeper / MyTonWallet / Telegram Wallet) that should receive the NFT. The seller copies this address in Fragment.",
    continue: "Order \u00b7 hold balance",
    send: "Submit address",
    addressInvalid: "Enter a valid TON wallet address",
    cancelled: "Cancel order",
    copy: "Copy address",
    copied: "Address copied",
    txLabel: "Transfer transaction hash",
    txHint: "After transferring the number in Fragment, paste the transaction hash here.",
    submitTx: "Submit for verification",
    verifying: "Waiting for admin verification",
    waiting: "Seller is transferring the number on-chain",
    myOrders: "My +888 orders",
    sellerTitle: "On-chain number sales",
    sellerNone: "No +888 orders right now.",
    remaining: "Hold expires in",
    adminTitle: "Number escrow",
    adminNone: "No transfers waiting for verification.",
    approve: "Verify & release",
    reject: "Reject",
    buyer: "Buyer",
    seller: "Seller",
    st_awaiting_address: "Awaiting wallet address",
    st_awaiting_transfer: "Awaiting on-chain transfer",
    st_verifying: "Verifying transfer",
    st_completed: "Completed",
    st_cancelled: "Cancelled",
    st_expired: "Hold expired",
    st_rejected: "Rejected",
  },
  bn: {
    note: "+888 \u09a8\u09be\u09ae\u09cd\u09ac\u09be\u09b0 Fragment \u098f\u09b0 NFT\u0964 \u09b8\u09c7\u09b2\u09be\u09b0 \u0986\u09aa\u09a8\u09be\u09b0 TON \u0993\u09af\u09bc\u09be\u09b2\u09c7\u099f\u09c7 \u09a8\u09be\u09ae\u09cd\u09ac\u09be\u09b0\u099f\u09bf \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09be\u09b0 \u0995\u09b0\u09be \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4 \u0986\u09aa\u09a8\u09be\u09b0 \u09ac\u09cd\u09af\u09be\u09b2\u09c7\u09a8\u09cd\u09b8 \u09b9\u09cb\u09b2\u09cd\u09a1 \u09a5\u09be\u0995\u09ac\u09c7\u0964",
    price: "\u09a8\u09be\u09ae\u09cd\u09ac\u09be\u09b0\u09c7\u09b0 \u09a6\u09be\u09ae",
    fee: "\u09b8\u09c7\u09ac\u09be \u09ab\u09bf (\u09eb%)",
    total: "\u0986\u09aa\u09a8\u09bf \u09a6\u09bf\u09ac\u09c7\u09a8 (\u09b9\u09cb\u09b2\u09cd\u09a1)",
    addressTitle: "\u0986\u09aa\u09a8\u09be\u09b0 TON \u0993\u09af\u09bc\u09be\u09b2\u09c7\u099f \u098f\u09a1\u09cd\u09b0\u09c7\u09b8",
    addressHint: "\u09af\u09c7 TON \u0993\u09af\u09bc\u09be\u09b2\u09c7\u099f\u09c7 (Tonkeeper / MyTonWallet / Telegram Wallet) NFT \u09a8\u09bf\u09a4\u09c7 \u099a\u09be\u09a8, \u09b8\u09c7\u099f\u09bf\u09b0 \u098f\u09a1\u09cd\u09b0\u09c7\u09b8 \u09a6\u09bf\u09a8\u0964 \u09b8\u09c7\u09b2\u09be\u09b0 Fragment \u09a5\u09c7\u0995\u09c7 \u098f\u0987 \u098f\u09a1\u09cd\u09b0\u09c7\u09b8\u09c7 \u09a8\u09be\u09ae\u09cd\u09ac\u09be\u09b0\u099f\u09bf \u09aa\u09be\u09a0\u09be\u09ac\u09c7\u0964",
    continue: "\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u00b7 \u09ac\u09cd\u09af\u09be\u09b2\u09c7\u09a8\u09cd\u09b8 \u09b9\u09cb\u09b2\u09cd\u09a1",
    send: "\u098f\u09a1\u09cd\u09b0\u09c7\u09b8 \u099c\u09ae\u09be \u09a6\u09bf\u09a8",
    addressInvalid: "\u09b8\u09a0\u09bf\u0995 TON \u0993\u09af\u09bc\u09be\u09b2\u09c7\u099f \u098f\u09a1\u09cd\u09b0\u09c7\u09b8 \u09a6\u09bf\u09a8",
    cancelled: "\u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09ac\u09be\u09a4\u09bf\u09b2",
    copy: "\u098f\u09a1\u09cd\u09b0\u09c7\u09b8 \u0995\u09aa\u09bf",
    copied: "\u098f\u09a1\u09cd\u09b0\u09c7\u09b8 \u0995\u09aa\u09bf \u09b9\u09df\u09c7\u099b\u09c7",
    txLabel: "\u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09be\u09b0 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09be\u0995\u09b6\u09a8 \u09b9\u09cd\u09af\u09be\u09b6",
    txHint: "Fragment \u09a5\u09c7\u0995\u09c7 \u09a8\u09be\u09ae\u09cd\u09ac\u09be\u09b0 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09be\u09b0 \u0995\u09b0\u09be\u09b0 \u09aa\u09b0 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09be\u0995\u09b6\u09a8 \u09b9\u09cd\u09af\u09be\u09b6 \u098f\u0996\u09be\u09a8\u09c7 \u09a6\u09bf\u09a8\u0964",
    submitTx: "\u09af\u09be\u099a\u09be\u0987\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u099c\u09ae\u09be",
    verifying: "\u0985\u09cd\u09af\u09be\u09a1\u09ae\u09bf\u09a8 \u09af\u09be\u099a\u09be\u0987 \u0995\u09b0\u099b\u09c7\u09a8",
    waiting: "\u09b8\u09c7\u09b2\u09be\u09b0 \u09a8\u09be\u09ae\u09cd\u09ac\u09be\u09b0\u099f\u09bf \u0985\u09a8\u099a\u09c7\u0987\u09a8\u09c7 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09be\u09b0 \u0995\u09b0\u099b\u09c7",
    myOrders: "\u0986\u09ae\u09be\u09b0 +888 \u0985\u09b0\u09cd\u09a1\u09be\u09b0",
    sellerTitle: "\u0985\u09a8\u099a\u09c7\u0987\u09a8 \u09a8\u09be\u09ae\u09cd\u09ac\u09be\u09b0 \u09ac\u09bf\u0995\u09cd\u09b0\u09af\u09bc",
    sellerNone: "\u098f\u0996\u09a8 \u0995\u09cb\u09a8\u09cb +888 \u0985\u09b0\u09cd\u09a1\u09be\u09b0 \u09a8\u09c7\u0987\u0964",
    remaining: "\u09b9\u09cb\u09b2\u09cd\u09a1 \u09ac\u09be\u0995\u09bf",
    adminTitle: "\u09a8\u09be\u09ae\u09cd\u09ac\u09be\u09b0 \u098f\u09b8\u09cd\u0995\u09cd\u09b0\u09cb",
    adminNone: "\u09af\u09be\u099a\u09be\u0987\u09c7\u09b0 \u099c\u09a8\u09cd\u09af \u0995\u09cb\u09a8\u09cb \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09be\u09b0 \u09a8\u09c7\u0987\u0964",
    approve: "\u09af\u09be\u099a\u09be\u0987 \u0995\u09b0\u09c7 \u09b0\u09bf\u09b2\u09bf\u099c",
    reject: "\u09ac\u09be\u09a4\u09bf\u09b2",
    buyer: "\u0995\u09cd\u09b0\u09c7\u09a4\u09be",
    seller: "\u09b8\u09c7\u09b2\u09be\u09b0",
    st_awaiting_address: "\u0993\u09af\u09bc\u09be\u09b2\u09c7\u099f \u098f\u09a1\u09cd\u09b0\u09c7\u09b8\u09c7\u09b0 \u0985\u09aa\u09c7\u0995\u09cd\u09b7\u09be\u09af\u09bc",
    st_awaiting_transfer: "\u0985\u09a8\u099a\u09c7\u0987\u09a8 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09be\u09b0\u09c7\u09b0 \u0985\u09aa\u09c7\u0995\u09cd\u09b7\u09be\u09af\u09bc",
    st_verifying: "\u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09ab\u09be\u09b0 \u09af\u09be\u099a\u09be\u0987 \u099a\u09b2\u099b\u09c7",
    st_completed: "\u09b8\u09ae\u09cd\u09aa\u09a8\u09cd\u09a8",
    st_cancelled: "\u09ac\u09be\u09a4\u09bf\u09b2",
    st_expired: "\u09b9\u09cb\u09b2\u09cd\u09a1 \u09b6\u09c7\u09b7",
    st_rejected: "\u09b0\u09bf\u099c\u09c7\u0995\u09cd\u099f\u09c7\u09a1",
  },
};

export function escrowT(lang, key, params) {
  const dict = STRINGS[lang] || STRINGS.en;
  let text = dict[key] ?? STRINGS.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) text = text.split("{" + name + "}").join(String(value));
  }
  return text;
}

export function statusLabel(lang, status) {
  return escrowT(lang, "st_" + status);
}

export const STATUS_STYLE = {
  awaiting_address: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  awaiting_transfer: "border-ring/30 bg-ring/[.12] text-ring",
  verifying: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  cancelled: "border-white/15 bg-white/[.06] text-muted-foreground",
  expired: "border-white/15 bg-white/[.06] text-muted-foreground",
  rejected: "border-red-400/30 bg-red-400/10 text-red-400",
};
