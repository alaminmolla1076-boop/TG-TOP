import React, { useEffect, useState } from "react";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getNumberEscrowQueue, reviewNumberEscrow, tonviewerTx } from "@/api/numberEscrow";
import { useAppLang } from "@/lib/AppLanguageContext";
import { escrowT } from "@/components/escrow/strings";
import { formatMoney } from "@/lib/format";

// Admin queue for +888 escrow: every seller-submitted transfer is checked
// on-chain (the hash opens in tonviewer) before the hold is captured.
export default function AdminEscrowTab() {
  const { toast } = useToast();
  const { lang } = useAppLang();
  const t = (key) => escrowT(lang, key);
  const [orders, setOrders] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const res = await getNumberEscrowQueue();
      setOrders(res.orders || []);
    } catch {
      setOrders([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(order, approve) {
    if (busyId) return;
    setBusyId(order.id);
    try {
      await reviewNumberEscrow(order.id, approve);
      await load();
    } catch (err) {
      toast({
        title: t(approve ? "approve" : "reject"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyId(null);
  }

  if (orders === null) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#A29BFE]" />
      </div>
    );
  }

  if (!orders.length) {
    return <p className="py-8 text-center text-[13px] text-muted-foreground">{t("adminNone")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-ring">{t("adminTitle")}</p>
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-col gap-2 rounded-3xl border border-ring/[.22] bg-card/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-sm font-semibold text-foreground">{order.phone_number}</p>
            <span className="shrink-0 font-mono text-[12.5px] font-semibold text-[#A29BFE]">
              {formatMoney(Number(order.price))}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
            <span className="truncate">{t("buyer")}: {order.buyer_email}</span>
            <span className="truncate">{t("seller")}: {order.seller_email}</span>
            <span className="break-all font-mono text-[10.5px]">{order.ton_address}</span>
          </div>
          <a
            href={tonviewerTx(order.tx_hash)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 truncate text-[11px] text-ring underline decoration-ring/40 underline-offset-2"
          >
            <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="truncate">{order.tx_hash}</span>
          </a>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => review(order, true)}
              disabled={busyId === order.id}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-gradient-to-br from-primary to-[#8E7DFF] px-3 py-2 text-[11.5px] font-semibold text-white transition-opacity disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              {t("approve")}
            </button>
            <button
              type="button"
              onClick={() => review(order, false)}
              disabled={busyId === order.id}
              className="flex items-center justify-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11.5px] font-semibold text-red-400 transition-opacity disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.4} />
              {t("reject")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
