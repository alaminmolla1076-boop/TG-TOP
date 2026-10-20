import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import StockPoolPrice from "./StockPoolPrice";

// One country card — flag + name + total stock on top, then a separate price
// editor for each stock pool the seller has (Non-Spam / Spam). Nordic Frost
// Glass.
export default function StockPriceRow({ country, pools, getValue, isBusy, onValue, onSave }) {
  const { t } = useAppLang();
  const total = pools.reduce((n, p) => n + (Number(p.stock) || 0), 0);
  // Non-Spam pool first, Spam pool second.
  const ordered = [...pools].sort((a, b) => Number(!!a.spam) - Number(!!b.spam));
  return (
    <div className="rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ring/25 bg-secondary/80 text-lg">
          {country.flag || country.country_iso}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{country.country_name}</p>
          <p className="text-[11px] text-muted-foreground">{t("s1.stockBuyers", { n: total })}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {ordered.map((p) => (
          <StockPoolPrice
            key={p.spam ? "spam" : "nonspam"}
            pool={p}
            value={getValue(p)}
            busy={isBusy(p)}
            onValue={(v) => onValue(p, v)}
            onSave={() => onSave(p)}
          />
        ))}
      </div>
    </div>
  );
}