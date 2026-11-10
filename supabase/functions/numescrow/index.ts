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

// ── Telegram notifications (same bot chat the app already uses) ────────────
const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";

async function tgSend(chatId, text) {
  if (!TG_TOKEN || !chatId) return;
  try {
    await fetch("https://api.telegram.org/bot" + TG_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: String(chatId), text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch (e) {
    console.error("telegram notify failed:", e?.message);
  }
}

async function sellerChatId(email) {
  if (!email) return null;
  const m = /^tg(\d+)@telegram\.local$/i.exec(String(email).trim());
  if (m) return m[1];
  const rows = await rest("profiles?select=telegram_id&email=eq." + encodeURIComponent(email));
  return (rows || [])[0]?.telegram_id ? String(rows[0].telegram_id) : null;
}

async function sellerLang(chatId) {
  if (!chatId) return "en";
  try {
    const rows = await rest("bot_state?select=value&key=eq." + encodeURIComponent("lang:" + chatId));
    return (rows || [])[0]?.value || "en";
  } catch {
    return "en";
  }
}

const SELLER_COPY: Record<string, any> = {
  "en": {
    "newTitle": "🎉 <b>New order!</b>",
    "newBody": "📱 Number: <b>{num}</b>\n💵 Amount: <b>{amount}</b>\n🏦 Buyer TON address:\n<code>{address}</code>\n\n⏳ Transfer the number from Fragment to this address within 30 minutes, then submit the Tx hash in Inventory → Number sales.",
    "paidTitle": "✅ <b>Sale completed!</b>",
    "paidBody": "📱 Number: <b>{num}</b>\n💵 <b>{amount}</b> has been credited to your balance."
  },
  "bn": {
    "newTitle": "🎉 <b>নতুন অর্ডার!</b>",
    "newBody": "📱 নাম্বার: <b>{num}</b>\n💵 পরিমাণ: <b>{amount}</b>\n🏦 বায়ারের TON অ্যাড্রেস:\n<code>{address}</code>\n\n⏳ ৩০ মিনিটের মধ্যে Fragment থেকে নাম্বারটি এই অ্যাড্রেসে ট্রান্সফার করে Inventory → Number sales থেকে Tx হ্যাশ জমা দিন।",
    "paidTitle": "✅ <b>বিক্রয় সম্পন্ন!</b>",
    "paidBody": "📱 নাম্বার: <b>{num}</b>\n💵 <b>{amount}</b> আপনার ব্যালেন্সে যোগ হয়েছে।"
  },
  "zh": {
    "newTitle": "🎉 <b>新订单！</b>",
    "newBody": "📱 号码：<b>{num}</b>\n💵 金额：<b>{amount}</b>\n🏦 买家 TON 地址：\n<code>{address}</code>\n\n⏳ 请在 30 分钟内于 Fragment 将此号码转入该地址，然后在 Inventory → Number sales 提交交易哈希。",
    "paidTitle": "✅ <b>出售完成！</b>",
    "paidBody": "📱 号码：<b>{num}</b>\n💵 <b>{amount}</b> 已存入你的余额。"
  },
  "es": {
    "newTitle": "🎉 <b>¡Nuevo pedido!</b>",
    "newBody": "📱 Número: <b>{num}</b>\n💵 Importe: <b>{amount}</b>\n🏦 Dirección TON del comprador:\n<code>{address}</code>\n\n⏳ Transfiere el número desde Fragment a esta dirección en 30 minutos y luego envía el hash de la Tx en Inventory → Number sales.",
    "paidTitle": "✅ <b>¡Venta completada!</b>",
    "paidBody": "📱 Número: <b>{num}</b>\n💵 <b>{amount}</b> se ha abonado a tu saldo."
  },
  "hi": {
    "newTitle": "🎉 <b>नया ऑर्डर!</b>",
    "newBody": "📱 नंबर: <b>{num}</b>\n💵 राशि: <b>{amount}</b>\n🏦 खरीदार का TON पता:\n<code>{address}</code>\n\n⏳ 30 मिनट के भीतर Fragment से नंबर इस पते पर ट्रांसफर करें, फिर Inventory → Number sales में Tx हैश जमा करें।",
    "paidTitle": "✅ <b>बिक्री पूर्ण!</b>",
    "paidBody": "📱 नंबर: <b>{num}</b>\n💵 <b>{amount}</b> आपके बैलेंस में जोड़ दिया गया है।"
  },
  "ar": {
    "newTitle": "🎉 <b>طلب جديد!</b>",
    "newBody": "📱 الرقم: <b>{num}</b>\n💵 المبلغ: <b>{amount}</b>\n🏦 عنوان TON الخاص بالمشتري:\n<code>{address}</code>\n\n⏳ حوّل الرقم من Fragment إلى هذا العنوان خلال 30 دقيقة، ثم أرسل هاش المعاملة من Inventory → Number sales.",
    "paidTitle": "✅ <b>اكتمل البيع!</b>",
    "paidBody": "📱 الرقم: <b>{num}</b>\n💵 تمت إضافة <b>{amount}</b> إلى رصيدك."
  },
  "fr": {
    "newTitle": "🎉 <b>Nouvelle commande !</b>",
    "newBody": "📱 Numéro : <b>{num}</b>\n💵 Montant : <b>{amount}</b>\n🏦 Adresse TON de l'acheteur :\n<code>{address}</code>\n\n⏳ Transférez le numéro depuis Fragment vers cette adresse sous 30 minutes, puis envoyez le hash de la transaction dans Inventory → Number sales.",
    "paidTitle": "✅ <b>Vente terminée !</b>",
    "paidBody": "📱 Numéro : <b>{num}</b>\n💵 <b>{amount}</b> a été crédité sur votre solde."
  },
  "ru": {
    "newTitle": "🎉 <b>Новый заказ!</b>",
    "newBody": "📱 Номер: <b>{num}</b>\n💵 Сумма: <b>{amount}</b>\n🏦 TON-адрес покупателя:\n<code>{address}</code>\n\n⏳ Переведите номер из Fragment на этот адрес в течение 30 минут, затем отправьте хеш транзакции в Inventory → Number sales.",
    "paidTitle": "✅ <b>Продажа завершена!</b>",
    "paidBody": "📱 Номер: <b>{num}</b>\n💵 <b>{amount}</b> зачислено на ваш баланс."
  },
  "pt": {
    "newTitle": "🎉 <b>Novo pedido!</b>",
    "newBody": "📱 Número: <b>{num}</b>\n💵 Valor: <b>{amount}</b>\n🏦 Endereço TON do comprador:\n<code>{address}</code>\n\n⏳ Transfira o número do Fragment para este endereço em 30 minutos e depois envie o hash da transação em Inventory → Number sales.",
    "paidTitle": "✅ <b>Venda concluída!</b>",
    "paidBody": "📱 Número: <b>{num}</b>\n💵 <b>{amount}</b> foi creditado no seu saldo."
  },
  "de": {
    "newTitle": "🎉 <b>Neue Bestellung!</b>",
    "newBody": "📱 Nummer: <b>{num}</b>\n💵 Betrag: <b>{amount}</b>\n🏦 TON-Adresse des Käufers:\n<code>{address}</code>\n\n⏳ Übertrage die Nummer innerhalb von 30 Minuten von Fragment an diese Adresse und sende dann den Tx-Hash unter Inventory → Number sales.",
    "paidTitle": "✅ <b>Verkauf abgeschlossen!</b>",
    "paidBody": "📱 Nummer: <b>{num}</b>\n💵 <b>{amount}</b> wurde deinem Guthaben gutgeschrieben."
  }
};

function sellerMessage(lang, kind, order) {
  const code = String(lang || "en").toLowerCase().split(/[-_]/)[0];
  const copy = SELLER_COPY[code] || SELLER_COPY.en;
  const num = order?.phone_number || "";
  const amount = "$" + money(order?.price).toFixed(2);
  const body = String(kind === "new" ? copy.newBody : copy.paidBody)
    .split("{num}").join(num)
    .split("{amount}").join(amount)
    .split("{address}").join(order?.ton_address || "");
  return (kind === "new" ? copy.newTitle : copy.paidTitle) + "\n\n" + body;
}

async function notifySeller(order, kind) {
  try {
    const chatId = await sellerChatId(order?.seller_email);
    if (!chatId) return;
    const lang = await sellerLang(chatId);
    await tgSend(chatId, sellerMessage(lang, kind, order));
  } catch (e) {
    console.error("seller notify failed:", e?.message);
  }
}

// ── On-chain verification of the seller's transfer ─────────────────────────
const TONAPI = "https://tonapi.io/v2";

async function tonGet(path) {
  try {
    const key = Deno.env.get("TONAPI_KEY") || "";
    const r = await fetch(TONAPI + path, { headers: key ? { Authorization: "Bearer " + key } : {} });
    if (!r.ok) return { ok: false, status: r.status };
    return { ok: true, data: await r.json() };
  } catch {
    return { ok: false, status: 0 };
  }
}

function hexToB64url(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const digitsOf = (v) => String(v || "").replace(/\D/g, "");
const stripCountry = (v) => v.replace(/^1/, "");

function sameNumber(nftName, phone) {
  const a = digitsOf(nftName);
  const p = stripCountry(digitsOf(phone));
  if (!a || !p || p.length < 5) return false;
  return a === p || a === "1" + p || stripCountry(a) === p;
}

// Returns { ok: true } only when the hash is a successful TON transaction AND
// the buyer's own wallet now holds the +888 NFT for this number.
async function verifyOnChain(order) {
  const hash = String(order?.tx_hash || "").trim();
  if (!hash) return { ok: false, reason: "No transaction hash" };
  let tx = await tonGet("/transactions/" + encodeURIComponent(hash));
  if (!tx.ok && /^[0-9a-f]{64}$/i.test(hash)) tx = await tonGet("/transactions/" + encodeURIComponent(hexToB64url(hash)));
  if (!tx.ok) return { ok: false, reason: "Transaction not found on the TON blockchain yet" };
  if (tx.data && tx.data.success === false) return { ok: false, reason: "The transaction failed on-chain" };
  const owner = String(order?.ton_address || "").trim();
  if (!owner) return { ok: false, reason: "Buyer TON address missing" };
  const nfts = await tonGet("/accounts/" + encodeURIComponent(owner) + "/nfts?limit=200");
  if (!nfts.ok) return { ok: false, reason: "TON API is busy — admin will review" };
  const items = Array.isArray(nfts.data?.nft_items) ? nfts.data.nft_items : [];
  const hit = items.find((it) => {
    const name = it?.metadata?.name || "";
    const coll = String(it?.collection?.name || "") + " " + String(it?.collection?.address || "");
    return /anonymous|888/i.test(coll) && sameNumber(name, order.phone_number);
  });
  if (!hit) return { ok: false, reason: "The number NFT is not in the buyer's wallet yet" };
  return { ok: true, name: hit?.metadata?.name || order.phone_number };
}


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
    await notifySeller({ ...order, ton_address: clean }, "new");
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
  const proof = await verifyOnChain({ ...order, tx_hash: clean });
  if (proof.ok) {
    const settled = await rpc("settle_number_escrow", { p_order_id: order.id, p_reviewer: "auto:onchain" });
    await notifySeller(order, "paid");
    return json({ ok: true, status: "completed", auto: true, settlement: settled });
  }
  await rest("number_escrow_orders?id=eq." + order.id, {
    method: "PATCH",
    body: JSON.stringify({ note: proof.reason, updated_date: nowIso() }),
  });
  return json({ ok: true, status: "verifying", message: proof.reason });
}

async function adminQueue(initData) {
  const me = await identity(initData);
  if (me.role !== "admin") throw new Error("Admins only");
  await rpc("expire_number_escrows", {});
  let rows = await rest("number_escrow_orders?select=*&status=eq.verifying&order=updated_date.asc&limit=50");
  rows = rows || [];
  let retried = false;
  for (const o of rows.slice(0, 5)) {
    if (Date.now() - new Date(o.updated_date || o.created_date).getTime() < 20000) continue;
    const proof = await verifyOnChain(o);
    if (proof.ok) {
      await rpc("settle_number_escrow", { p_order_id: o.id, p_reviewer: "auto:onchain" });
      await notifySeller(o, "paid");
      retried = true;
    } else {
      await rest("number_escrow_orders?id=eq." + o.id, {
        method: "PATCH",
        body: JSON.stringify({ note: proof.reason, updated_date: nowIso() }),
      });
    }
  }
  if (retried) rows = (await rest("number_escrow_orders?select=*&status=eq.verifying&order=updated_date.asc&limit=50")) || [];
  return json({ orders: rows });
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
  await notifySeller(order, "paid");
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
