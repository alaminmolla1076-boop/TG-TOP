// +888 number on-chain escrow.
// Buyer orders a number, submits the TON wallet address the Fragment NFT must
// go to, and the price + 5% fee is held from their balance. The seller copies
// that address, transfers the NFT from Fragment, submits the transaction hash,
// an admin verifies it on-chain and the hold is captured (seller paid, listing
// and login credentials handed to the buyer).
const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function rest(path, init = {}) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: "Bearer " + SERVICE_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error((data && (data.message || data.error)) || "Database error (" + r.status + ")");
  return data;
}
const rpc = (fn, args) => rest("rpc/" + fn, { method: "POST", body: JSON.stringify(args || {}) });

async function identity(initData) {
  if (!initData) throw new Error("Open the app from Telegram");
  const r = await fetch(SUPABASE_URL + "/functions/v1/b44fn/webTelegramAuth", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY },
    body: JSON.stringify({ initData }),
  });
  const data = await r.json().catch(() => ({}));
  const email = data.identity_email || data.email || "";
  if (!r.ok || !email) throw new Error(data.error || "Telegram login verification failed");
  return { email, role: data.role || "user", name: [data.first_name, data.last_name].filter(Boolean).join(" ") };
}

const TON_ADDRESS = /^(?:[EU]Q[A-Za-z0-9_-]{46}|-?[0-9]+:[0-9a-fA-F]{64})$/;
const TX_HASH = /^[A-Za-z0-9+/=_-]{40,100}$/;
const minutes = (n) => new Date(Date.now() + n * 60000).toISOString();
const money = (n) => Math.round(Number(n) * 100) / 100;
const nowIso = () => new Date().toISOString();

async function listingFor(id) {
  const rows = await rest(
    "vip_number_prices?select=*&or=(id.eq." + encodeURIComponent(id) + ",account_id.eq." + encodeURIComponent(id) + ")"
  );
  const listing = (rows || [])[0];
  if (!listing) throw new Error("This number is no longer listed");
  return listing;
}

async function orderFor(initData, orderId) {
  const rows = await rest("number_escrow_orders?select=*&id=eq." + encodeURIComponent(orderId));
  const order = (rows || [])[0];
  if (!order) throw new Error("Order not found");
  return order;
}

async function createOrder(initData, listingId) {
  const me = await identity(initData);
  const listing = await listingFor(listingId);
  if (listing.sold) throw new Error("This number has already been sold");
  const accountRows = await rest("tg_accounts?select=id,phone_number,country_iso,status,owner_email,price&id=eq." + encodeURIComponent(listing.account_id));
  const account = (accountRows || [])[0];
  if (!account || account.status !== "available") throw new Error("This number is no longer available");
  const sellerEmail = String(listing.seller_email || account.owner_email || "");
  if (!sellerEmail) throw new Error("This listing has no seller");
  if (sellerEmail.toLowerCase() === me.email.toLowerCase()) throw new Error("You cannot buy your own listing");
  const price = money(listing.price);
  if (!(price > 0)) throw new Error("This number has no price yet");
  const fee = money(price * 0.05);
  const total = money(price + fee);
  const balance = Number(await rpc("commerce_balance", { p_email: me.email })) || 0;
  if (balance < total) throw new Error("Insufficient balance — you need " + total.toFixed(2) + " USDT (price + 5% fee)");

  await rpc("expire_number_escrows", {});
  const rows = await rest("number_escrow_orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      listing_id: listing.id,
      account_id: listing.account_id,
      phone_number: account.phone_number,
      kind: listing.kind || "p888",
      seller_email: sellerEmail,
      buyer_email: me.email,
      price,
      fee,
      hold_amount: total,
      status: "awaiting_address",
      expires_at: minutes(15),
    }),
  });
  const order = (rows || [])[0];
  return json({ order, balance: Number(await rpc("commerce_balance", { p_email: me.email })) || 0 });
}

async function setAddress(initData, orderId, address) {
  const me = await identity(initData);
  const order = await orderFor(initData, orderId);
  if (order.buyer_email !== me.email) throw new Error("This order belongs to someone else");
  const clean = String(address || "").trim().replace(/\s+/g, "");
  if (!TON_ADDRESS.test(clean)) throw new Error("Enter a valid TON wallet address (UQ… / EQ… / 0:…)");
  if (order.status === "awaiting_transfer") {
    await rest("number_escrow_orders?id=eq." + order.id, {
      method: "PATCH",
      body: JSON.stringify({ ton_address: clean, expires_at: minutes(30), updated_date: nowIso() }),
    });
  } else if (order.status === "awaiting_address") {
    await rest("number_escrow_orders?id=eq." + order.id, {
      method: "PATCH",
      body: JSON.stringify({ ton_address: clean, status: "awaiting_transfer", expires_at: minutes(30), updated_date: nowIso() }),
    });
  } else {
    throw new Error("This order can no longer take an address");
  }
  return json({ ok: true, order: (await rest("number_escrow_orders?select=*&id=eq." + order.id))[0] });
}

async function cancelOrder(initData, orderId) {
  const me = await identity(initData);
  const order = await orderFor(initData, orderId);
  if (order.buyer_email !== me.email) throw new Error("This order belongs to someone else");
  if (!["awaiting_address", "awaiting_transfer"].includes(order.status)) {
    throw new Error("This order can no longer be cancelled");
  }
  await rest("number_escrow_orders?id=eq." + order.id, {
    method: "PATCH",
    body: JSON.stringify({ status: "cancelled", updated_date: nowIso() }),
  });
  await rpc("expire_number_escrows", {});
  return json({ ok: true, balance: Number(await rpc("commerce_balance", { p_email: me.email })) || 0 });
}

async function myOrders(initData) {
  const me = await identity(initData);
  await rpc("expire_number_escrows", {});
  const rows = await rest(
    "number_escrow_orders?select=*&buyer_email=eq." + encodeURIComponent(me.email) + "&order=created_date.desc&limit=30"
  );
  return json({ orders: rows || [], balance: Number(await rpc("commerce_balance", { p_email: me.email })) || 0 });
}

async function sellerOrders(initData) {
  const me = await identity(initData);
  await rpc("expire_number_escrows", {});
  const rows = await rest(
    "number_escrow_orders?select=*&seller_email=eq." + encodeURIComponent(me.email) + "&order=created_date.desc&limit=40"
  );
  return json({ orders: rows || [] });
}

async function submitTx(initData, orderId, txHash) {
  const me = await identity(initData);
  const order = await orderFor(initData, orderId);
  if (order.seller_email !== me.email) throw new Error("This order belongs to another seller");
  if (order.status !== "awaiting_transfer") throw new Error("This order is not waiting for a transfer");
  if (order.expires_at && new Date(order.expires_at).getTime() < Date.now()) {
    throw new Error("The buyer's hold expired — the order was cancelled");
  }
  const clean = String(txHash || "").trim();
  if (!TX_HASH.test(clean)) throw new Error("Enter the on-chain transaction hash");
  await rest("number_escrow_orders?id=eq." + order.id, {
    method: "PATCH",
    body: JSON.stringify({ tx_hash: clean, status: "verifying", updated_date: nowIso() }),
  });
  return json({ ok: true });
}

async function adminQueue(initData) {
  const me = await identity(initData);
  if (me.role !== "admin") throw new Error("Admins only");
  await rpc("expire_number_escrows", {});
  const rows = await rest("number_escrow_orders?select=*&status=eq.verifying&order=updated_date.asc&limit=50");
  return json({ orders: rows || [] });
}

async function adminReview(initData, orderId, approve, note) {
  const me = await identity(initData);
  if (me.role !== "admin") throw new Error("Admins only");
  const order = await orderFor(initData, orderId);
  if (order.status !== "verifying") throw new Error("This order is not awaiting verification");
  if (!approve) {
    await rest("number_escrow_orders?id=eq." + order.id, {
      method: "PATCH",
      body: JSON.stringify({ status: "rejected", note: String(note || "").slice(0, 500), reviewed_by: me.email, updated_date: nowIso() }),
    });
    await rpc("expire_number_escrows", {});
    return json({ ok: true, status: "rejected" });
  }
  const settled = await rpc("settle_number_escrow", { p_order_id: order.id, p_reviewer: me.email });
  return json({ ok: true, status: "completed", settlement: settled });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const action = new URL(req.url).pathname.split("/").filter(Boolean).pop() || "";
  try {
    const body = await req.json().catch(() => ({}));
    const initData = body.init_data || body.initData || req.headers.get("x-tg-init-data") || "";
    switch (action) {
      case "order":
        return await createOrder(initData, String(body.listing_id || ""));
      case "setAddress":
        return await setAddress(initData, String(body.order_id || ""), body.address);
      case "cancel":
        return await cancelOrder(initData, String(body.order_id || ""));
      case "myOrders":
        return await myOrders(initData);
      case "sellerOrders":
        return await sellerOrders(initData);
      case "submitTx":
        return await submitTx(initData, String(body.order_id || ""), body.tx_hash);
      case "adminQueue":
        return await adminQueue(initData);
      case "adminReview":
        return await adminReview(initData, String(body.order_id || ""), body.approve !== false, body.note);
      case "ping":
        return json({ ok: true });
      default:
        return json({ error: "Unknown action" }, 404);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
