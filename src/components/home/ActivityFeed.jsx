import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";

const statusStyle = {
  approved: "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/10",
  pending: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/10",
};

const tabs = [
  { key: "topups", label: "Top-Ups" },
  { key: "orders", label: "Orders" },
];

export default function ActivityFeed({ deposits, orders }) {
  const [tab, setTab] = useState("topups");

  return (
    <section className="space-y-4">
      <div className="flex rounded-full border border-border/60 bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "topups" ? (
        deposits.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No top-ups yet.</p>
        ) : (
          <div className="space-y-3">
            {deposits.slice(0, 3).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/80 p-4"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-primary">{formatMoney(d.amount)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {d.network} · {formatDate(d.created_date)}
                  </p>
                </div>
                <Badge className={statusStyle[d.status] || statusStyle.pending}>
                  {d.status}
                </Badge>
              </div>
            ))}
          </div>
        )
      ) : orders.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No orders yet — visit the Market to buy.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.slice(0, 3).map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/80 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{o.product_name}</p>
                <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">{o.status}</p>
              </div>
              <p className="shrink-0 font-display text-lg font-bold text-primary">
                {formatMoney(o.price)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}