import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Badge } from "@/components/ui/badge";
import SellWizard from "@/components/sell/SellWizard";
import StockPricesPanel from "@/components/sell/StockPricesPanel";
import { formatMoney } from "@/lib/format";

const saleStatusStyle = {
  pending: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  code_sent: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  completed: "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/10",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/10",
  failed: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/10",
};

const salesListStyles = {
  concierge: { list: "divide-y divide-dotted divide-border/60", row: "py-3" },
  ribbon: { list: "space-y-3", row: "rounded-xl border border-l-2 border-l-primary/60 border-border/60 bg-card/80 p-4" },
  focus: { list: "space-y-2.5", row: "rounded-2xl border border-border/40 bg-muted/30 p-4" },
  vault: { list: "space-y-2 rounded-xl border-2 border-primary/40 p-1.5", row: "rounded-lg border border-border/70 bg-card p-3" },
};

export default function Sell() {
  const { fetchMyData } = useTgIdentity();
  const [sales, setSales] = useState(null);
  const [stock, setStock] = useState(null);
  const variant = "concierge";
  const listStyle = salesListStyles[variant];

  async function load(force = false) {
    const data = await fetchMyData(force);
    setSales(data.account_sales || []);
    setStock(data.my_stock || []);
  }

  useEffect(() => {
    load().catch(() => {
      setSales([]);
      setStock([]);
    });
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <StockPricesPanel stock={stock} variant={variant} onSaved={() => load(true)} />

      <SellWizard variant={variant} onDone={() => load(true)} />

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">
          {variant === "concierge" && <span className="mr-1 font-display text-primary/80">02 ·</span>} My Account Sales
        </h2>
        {sales === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts submitted yet.</p>
        ) : (
          <div className={listStyle.list}>
            {sales.map((s) => (
              <div key={s.id} className={listStyle.row}>
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-medium">
                    {s.country_iso} · {s.phone_number}
                  </p>
                  <Badge className={saleStatusStyle[s.status] || saleStatusStyle.pending}>
                    {s.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reward: {formatMoney(Number(s.reward_amount))} · {s.reward_status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}