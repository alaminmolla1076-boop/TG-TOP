import React from "react";
import { formatDate, formatMoney } from "@/lib/format";

const statusStyle = {
  pending: { dot: "bg-amber-400", label: "text-amber-400" },
  approved: { dot: "bg-emerald-400", label: "text-emerald-400" },
  rejected: { dot: "bg-red-400", label: "text-red-400" },
};

export default function WithdrawList({ withdrawals }) {
  if (!withdrawals.length) {
    return <p className="text-sm text-muted-foreground">No withdrawals yet.</p>;
  }
  return (
    <div className="space-y-3">
      {withdrawals.map((w) => {
        const s = statusStyle[w.status] || statusStyle.pending;
        return (
          <div key={w.id} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card p-4">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-heading text-lg font-bold text-emerald-400">{formatMoney(w.amount)}</p>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${s.label}`}>
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