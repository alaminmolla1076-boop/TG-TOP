import React from "react";
import { Hourglass } from "lucide-react";
import SectionHead from "./SectionHead";
import { useAppLang } from "@/lib/AppLanguageContext";
import { AGE_OPTIONS, ageLabel } from "@/lib/accountAge";
import { ageStockTotals } from "@/lib/marketAges";
import GlassSelect from "@/components/ui/GlassSelect";

// Keep the age selector visible independently of stock or catalog loading.
export default function AgeFilterBar({ sellers, active, onChange, pool }) {
  const { t } = useAppLang();
  const stockByAge = new Map(ageStockTotals(sellers, pool).map((bucket) => [bucket.category, bucket.stock]));
  const options = [
    { value: "", label: t("ag.all") },
    ...AGE_OPTIONS.map(({ value }) => ({
      value,
      label: `${ageLabel(value, t)}${stockByAge.has(value) ? ` · ${stockByAge.get(value)}` : ""}`,
    })),
  ];
  const selectorId = `market-age-${pool || "all"}`;

  return (
    <section className="relative z-20 flex flex-col gap-2.5" data-market-age-filter>
      <SectionHead
        icon={<Hourglass className="h-4 w-4" strokeWidth={1.5} />}
        title={t("mk.ageShop")}
      />
      <div className="flex items-center gap-3 rounded-2xl border border-ring/25 bg-card/75 p-3">
        <label htmlFor={selectorId} className="shrink-0 text-xs font-semibold text-foreground">
          {t("sp.ageLabel")}
        </label>
        <GlassSelect
          id={selectorId}
          value={active || ""}
          onChange={(value) => onChange(value || null)}
          options={options}
          className="min-w-0 flex-1"
          triggerClass="h-11 rounded-full px-4 text-sm"
        />
      </div>
    </section>
  );
}