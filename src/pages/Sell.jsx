import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Badge } from "@/components/ui/badge";
import SellWizard from "@/components/sell/SellWizard";
import { formatMoney } from "@/lib/format";

const saleStatusStyle = {
  pending: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  code_sent: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  completed: "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/10",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/10",
  failed: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/10",
};

export default function Sell() {
  const { fetchMyData } = useTgIdentity();
  const [sales, setSales] = useState(null);

  async function load(force = false) {
    const data = await fetchMyData(force);
    setSales(data.account_sales || []);
  }

  useEffect(() => {
    load().catch(() => setSales([]));
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Sell Account</h1>

      <SellWizard onDone={() => load(true)} />

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">My Account Sales</h2>
        {sales === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {sales.map((s) => (
              <div key={s.id} className="rounded-xl border border-border/60 bg-card p-4">
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