import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";

const statusStyle = {
  pending: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  approved: "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/10",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/10",
};

export default function WithdrawList({ withdrawals }) {
  if (!withdrawals.length) {
    return <p className="text-sm text-muted-foreground">No withdrawals yet.</p>;
  }
  return (
    <div className="space-y-3">
      {withdrawals.map((w) => (
        <div key={w.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading font-semibold text-primary">{formatMoney(w.amount)}</p>
            <Badge className={statusStyle[w.status] || statusStyle.pending}>{w.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {w.network} · {formatDate(w.created_date)}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{w.wallet_address}</p>
        </div>
      ))}
    </div>
  );
}