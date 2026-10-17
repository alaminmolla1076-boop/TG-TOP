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

export default function Sell() {
  const { fetchMyData } = useTgIdentity();
  const [sales, setSales] = useState(null);
  const [stock, setStock] = useState(null);

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
      <StockPricesPanel stock={stock} onSaved={() => load(true)} />

      <SellWizard onDone={() => load(true)} />

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">
          <span className="mr-1 font-display text-primary/80">03 ·</span> My Account Sales
        </h2>
        {sales === null ? (
          <p className="text-sm text-[#9C9186]">Loading…</p>
        ) : sales.length === 0 ? (
          <p className="text-[11px] leading-[1.55] text-[#B8ADA2]">No accounts submitted yet.</p>
        ) : (
          <div className="divide-y divide-dotted divide-[#4A423B]">
            {sales.map((s) => (
              <div key={s.id} className="border-b border-dotted border-[#4A423B] py-3 first:pt-0 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-[#E8DFD6]">
                    {s.country_iso} · {s.phone_number}
                  </p>
                  <Badge className={saleStatusStyle[s.status] || saleStatusStyle.pending}>
                    {s.status}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-[#B8ADA2]">
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