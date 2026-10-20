import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";
import { formatMoney } from "@/lib/format";

export default function StockAgeList({ rows, active, onChange }) {
  const { t } = useAppLang();
  if (!rows.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-ring/20 bg-secondary/30 p-2">
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-[10px] font-semibold text-muted-foreground">
        <span>{t("sd.age")}</span>
        <span className="text-center">{t("c.inStock")}</span>
        <span className="text-right">{t("s1.unitPrice")}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <button
            key={row.age_category}
            type="button"
            aria-pressed={active === row.age_category}
            onClick={() => onChange(row.age_category)}
            className={`grid grid-cols-3 items-center gap-2 rounded-xl border px-3 py-3 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${active === row.age_category ? "border-ring/60 bg-primary/20" : "border-transparent bg-card/50 hover:border-ring/30"}`}
          >
            <span className="text-left font-semibold text-foreground">{ageLabel(row.age_category, t)}</span>
            <span className="text-center font-semibold tabular-nums text-muted-foreground">{row.stock}</span>
            <span className="text-right font-bold tabular-nums text-ring">{row.price != null ? formatMoney(row.price) : t("s1.noPrice")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}