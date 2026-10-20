import React from "react";
import { Check, Hourglass } from "lucide-react";
import SectionHead from "./SectionHead";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";
import { ageStockTotals } from "@/lib/marketAges";

// A seller's stocked ages, shown only after choosing their stock pool.
export default function AgeFilterBar({ sellers, active, onChange, pool }) {
  const { t } = useAppLang();
  const buckets = ageStockTotals(sellers, pool);
  if (!buckets.length) return null;

  return (
    <section className="flex flex-col gap-3" aria-label={t("sp.ageLabel")}>
      <SectionHead icon={<Hourglass className="h-4 w-4" strokeWidth={1.5} />} title={t("sp.ageLabel")} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {buckets.map((bucket) => (
          <button
            key={bucket.category}
            type="button"
            onClick={() => onChange(bucket.category)}
            aria-pressed={active === bucket.category}
            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${active === bucket.category ? "border-ring/70 bg-primary/20 text-foreground" : "border-ring/20 bg-card/75 text-muted-foreground hover:border-ring/50"}`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{ageLabel(bucket.category, t)}</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{t("sl.ageCount", { n: bucket.stock })}</span>
            </span>
            {active === bucket.category && <Check className="h-4 w-4 shrink-0 text-ring" />}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("ag.estimated")}</p>
    </section>
  );
}