import React from "react";
import { formatDate, formatMoney } from "@/lib/format";

const panelClass =
  "flex items-start gap-3 rounded-xl border border-border/50 bg-card/80 px-4 py-3.5 text-sm text-muted-foreground";

const statusStyle = {
  pending: { dot: "bg-primary shadow-[0_0_6px_hsl(var(--primary))]", label: "text-primary" },
  approved: { dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]", label: "text-emerald-400" },
  rejected: { dot: "bg-red-400 shadow-[0_0_6px_#f87171]", label: "text-red-400" },
};

export default function WithdrawList({ withdrawals }) {
  if (!withdrawals.length) {
    return (
      <div className={`${panelClass} items-center`}>
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
        No withdrawals yet.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {withdrawals.map((w) => {
        const s = statusStyle[w.status] || statusStyle.pending;
        return (
          <div key={w.id} className={panelClass}>
            <span className={`mt-1.5 h-[5px] w-[5px] shrink-0 rounded-full ${s.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-lg font-bold text-primary">{formatMoney(w.amount)}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${s.label}`}>
                  {w.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {w.network} · {formatDate(w.created_date)}
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{w.wallet_address}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}