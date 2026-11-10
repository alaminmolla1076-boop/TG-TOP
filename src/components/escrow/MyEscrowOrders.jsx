import React, { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { cancelNumberOrder, getMyNumberOrders, tonviewerTx } from "@/api/numberEscrow";
import { useAppLang } from "@/lib/AppLanguageContext";
import { escrowT, statusLabel, STATUS_STYLE } from "@/components/escrow/strings";
import { formatMoney } from "@/lib/format";
import TimeLeft from "@/components/escrow/TimeLeft";

const ACTIVE = ["awaiting_address", "awaiting_transfer", "verifying"];

// The buyer's own +888 orders: what is held, where the NFT is going and how
// long the hold lasts.
export default function MyEscrowOrders({ sellerEmail, refreshKey = 0 }) {
  const { lang } = useAppLang();
  const t = (key) => escrowT(lang, key);
  const [orders, setOrders] = useState(null);

  async function load() {
    try {
      const res = await getMyNumberOrders();
      setOrders(res.orders || []);
    } catch {
      setOrders([]);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  async function cancel(order) {
    try {
      await cancelNumberOrder(order.id);
      await load();
    } catch {
      /* the order may already have expired */
    }
  }

  const rows = (orders || []).filter((o) => !sellerEmail || o.seller_email === sellerEmail);
  if (!rows.length) return null;

  return (
    <section className="mk-sec flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
        <h2 className="leading-[1.3]">{t("myOrders")}</h2>
      </div>
      {rows.map((order) => (
        <div
          key={order.id}
          className="flex flex-col gap-2 rounded-[22px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-[14px] font-semibold text-foreground">{order.phone_number}</p>
            <span
              className={
                "shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold " +
                (STATUS_STYLE[order.status] || STATUS_STYLE.cancelled)
              }
            >
              {statusLabel(lang, order.status)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
            <span className="font-mono">{formatMoney(Number(order.hold_amount))}</span>
            {order.status === "awaiting_transfer" && order.expires_at && (
              <span className="flex items-center gap-1">
                {t("remaining")} <TimeLeft expiresAt={order.expires_at} className="font-mono tabular-nums text-ring" />
              </span>
            )}
          </div>
          {order.ton_address && (
            <p className="break-all font-mono text-[10.5px] leading-relaxed text-muted-foreground/80">{order.ton_address}</p>
          )}
          {order.tx_hash && (
            <a
              href={tonviewerTx(order.tx_hash)}
              target="_blank"
              rel="noreferrer"
              className="truncate text-[11px] text-ring underline decoration-ring/40 underline-offset-2"
            >
              {order.tx_hash}
            </a>
          )}
          {ACTIVE.includes(order.status) && order.status !== "verifying" && (
            <button
              type="button"
              onClick={() => cancel(order)}
              className="flex items-center justify-center gap-1.5 self-start rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" strokeWidth={2.4} />
              {t("cancelled")}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
