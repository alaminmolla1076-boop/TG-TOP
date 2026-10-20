import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatMoney } from "@/lib/format";

const pillClass = (spam) =>
  spam
    ? "border border-red-400/30 bg-red-400/10 text-red-300"
    : "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300";

// One stock-pool price editor inside a country card — the Spam and Non-Spam
// pools are priced separately, each with its own input + Save. Nordic Frost
// Glass.
export default function StockPoolPrice({ pool, age, value, busy, onValue, onSave }) {
  const { t } = useAppLang();
  const spam = !!pool.spam;
  return (
    <div className="rounded-2xl border border-ring/[.14] bg-secondary/45 px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`shrink-0 rounded-full px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[.08em] ${pillClass(spam)}`}
        >
          {t(spam ? "sl.spam" : "sl.nonSpam")}
        </span>
        {age ? (
          <span className="shrink-0 rounded-full border border-ring/35 bg-ring/[.12] px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[.08em] text-ring">
            {age}
          </span>
        ) : null}
        <p className="text-[11px] text-muted-foreground">{t("s1.poolStock", { n: pool.stock })}</p>
        <p className="ml-auto shrink-0 bg-gradient-to-r from-ring to-primary bg-clip-text font-display text-sm font-bold text-transparent">
          {pool.price != null ? formatMoney(pool.price) : t("s1.noPrice")}
        </p>
      </div>
      <div className="mt-2.5 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ring">$</span>
          <input
            value={value}
            onChange={(e) => onValue(e.target.value)}
            placeholder={t("s1.setPrice")}
            inputMode="decimal"
            disabled={busy}
            className="h-10 w-full rounded-full border border-ring/25 bg-secondary/80 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_3px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="h-10 shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] px-4 text-[11px] font-semibold uppercase tracking-[.06em] text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t("c.saving") : t("c.save")}
        </button>
      </div>
    </div>
  );
}