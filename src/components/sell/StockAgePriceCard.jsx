import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";
import StockPoolPrice from "@/components/sell/StockPoolPrice";

export default function StockAgePriceCard({ group, getValue, isBusy, onValue, onSave }) {
  const { t } = useAppLang();
  return (
    <div className="rounded-3xl border border-ring/25 bg-card/75 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ring/25 bg-secondary/80 text-lg">{group.flag || group.country_iso}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{group.country_name}</p>
          <p className="mt-1 text-xs font-semibold text-ring">{ageLabel(group.age_category, t)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {[false, true].map((spam) => {
          const row = group.pools.get(spam) || { ...group, pools: undefined, spam, stock: 0, price: null };
          return <StockPoolPrice key={String(spam)} pool={row} value={getValue(row)} busy={isBusy(row)} onValue={(value) => onValue(row, value)} onSave={() => onSave(row)} />;
        })}
      </div>
    </div>
  );
}