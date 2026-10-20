import React, { useState } from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import StockPoolPrice from "./StockPoolPrice";

const tabClass = (active, spam) =>
  `flex-1 cursor-pointer rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[.08em] transition-colors duration-200 ${
    active
      ? spam
        ? "border-red-400/60 bg-red-400/15 text-red-200"
        : "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
      : "border-ring/20 bg-secondary/60 text-muted-foreground hover:text-foreground"
  }`;

// One country card — flag + name + total stock on top, then side-by-side
// Spam / Non-Spam toggle tabs that switch which pool's price editor shows.
// Nordic Frost Glass.
export default function StockPriceRow({ country, pools, getValue, isBusy, onValue, onSave }) {
  const { t } = useAppLang();
  const [activeSpam, setActiveSpam] = useState(false);
  const total = pools.reduce((n, p) => n + (Number(p.stock) || 0), 0);
  // Non-Spam pool first, Spam pool second.
  const ordered = [...pools].sort((a, b) => Number(!!a.spam) - Number(!!b.spam));
  const active = ordered.find((p) => !!p.spam === activeSpam) || ordered[0];
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
      <div className="mt-3 flex gap-2">
        {ordered.map((p) => (
          <button
            key={p.spam ? "spam" : "nonspam"}
            type="button"
            className={tabClass(!!p.spam === activeSpam, !!p.spam)}
            onClick={() => setActiveSpam(!!p.spam)}
          >
            {t(p.spam ? "sl.spam" : "sl.nonSpam")} · {Number(p.stock) || 0}
          </button>
        ))}
      </div>
      {active && (
        <div className="mt-2.5">
          <StockPoolPrice
            pool={active}
            value={getValue(active)}
            busy={isBusy(active)}
            onValue={(v) => onValue(active, v)}
            onSave={() => onSave(active)}
          />
        </div>
      )}
    </div>
  );
}