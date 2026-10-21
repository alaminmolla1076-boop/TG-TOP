import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatMoney } from "@/lib/format";

const pillClass = (spam) =>
  spam
    ? "border border-red-400/30 bg-red-400/10 text-red-300"
    : "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300";

// One slim stock-pool price editor: badge · stock · current price · small
// input + Save, all on a single compact row. Nordic Frost Glass.
export default function StockPoolPrice({ pool, age, value, busy, onValue, onSave }) {
  const { t } = useAppLang();
  const spam = !!pool.spam;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-ring/[.14] bg-secondary/45 px-2.5 py-1.5">
      <span
        className={`shrink-0 rounded-full px-2 py-[2px] text-[9px] font-bold uppercase tracking-[.08em] ${pillClass(spam)}`}
      >
        {t(spam ? "sl.spam" : "sl.nonSpam")}
      </span>
      {age ? (
        <span className="shrink-0 rounded-full border border-ring/35 bg-ring/[.12] px-2 py-[2px] text-[9px] font-bold uppercase tracking-[.08em] text-ring">
          {age}
        </span>
      ) : null}
      <p className="shrink-0 text-[10px] text-muted-foreground">{t("s1.poolStock", { n: pool.stock })}</p>
      <p className="ml-auto shrink-0 bg-gradient-to-r from-ring to-primary bg-clip-text font-display text-[11px] font-bold text-transparent">
        {pool.price != null ? formatMoney(pool.price) : t("s1.noPrice")}
      </p>
      <div className="relative w-[72px] shrink-0">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ring">$</span>
        <input
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={t("s1.setPrice")}
          inputMode="decimal"
          disabled={busy}
          className="h-8 w-full rounded-lg border border-ring/25 bg-secondary/80 pl-5 pr-1.5 text-[11px] text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_2px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="h-8 shrink-0 cursor-pointer rounded-lg bg-gradient-to-br from-primary to-[#8E7DFF] px-3 text-[9px] font-semibold uppercase tracking-[.06em] text-primary-foreground shadow-[0_4px_12px_rgba(108,92,231,.45)] transition-opacity duration-200 hover:opacity-90 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? t("c.saving") : t("c.save")}
      </button>
    </div>
  );
}