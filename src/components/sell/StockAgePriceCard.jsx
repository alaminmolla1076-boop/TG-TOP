import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";
import StockPoolPrice from "@/components/sell/StockPoolPrice";

// Compact country card: slim flag + name row, then one tight price row per pool.
export default function StockAgePriceCard({ group, getValue, isBusy, onValue, onSave }) {
  const { t } = useAppLang();
  return (
    <div className="rounded-2xl border border-ring/25 bg-card/75 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-ring/25 bg-secondary/80 text-[11px] leading-none">{group.flag || group.country_iso}</span>
        <p className="min-w-0 truncate text-xs font-semibold text-foreground">{group.country_name}</p>
        <span className="ml-auto shrink-0 rounded-full bg-ring/[.12] px-2 py-[2px] text-[9px] font-bold uppercase tracking-[.08em] text-ring">
          {ageLabel(group.age_category, t)}
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {[false, true].map((spam) => {
          const row = group.pools.get(spam) || { ...group, pools: undefined, spam, stock: 0, price: null };
          return <StockPoolPrice key={String(spam)} pool={row} value={getValue(row)} busy={isBusy(row)} onValue={(value) => onValue(row, value)} onSave={() => onSave(row)} />;
        })}
      </div>
    </div>
  );
}