import React from "react";
import { Hourglass } from "lucide-react";
import SectionHead from "./SectionHead";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";
import { ageStockTotals } from "@/lib/marketAges";

const pillClass = (active) =>
  `flex shrink-0 cursor-pointer flex-col items-center gap-0.5 rounded-full border px-4 py-1.5 no-underline transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE] active:opacity-85 ${
    active
      ? "border-[#A29BFE]/70 bg-[rgba(108,92,231,.28)] text-white shadow-[0_0_14px_rgba(108,92,231,.4)]"
      : "border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] text-[#a8a3cf] hover:border-[#A29BFE]/55 hover:bg-[rgba(45,38,78,.8)]"
  }`;

// Capsule List Market — account-age filter: "All ages" plus one button per
// bucket that actually holds stock, each showing its live total. Selecting a
// bucket switches the page to the per-country age catalog. Nordic Frost Glass.
export default function AgeFilterBar({ sellers, active, onChange }) {
  const { t } = useAppLang();
  const buckets = ageStockTotals(sellers);

  return (
    <section className="mk-sec flex flex-col gap-2.5">
      <SectionHead
        icon={<Hourglass className="h-4 w-4" strokeWidth={1.5} />}
        title={t("mk.ageShop")}
      />
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={active == null}
          className={pillClass(active == null)}
        >
          <span className="text-[11px] font-bold uppercase tracking-[.06em]">{t("ag.all")}</span>
        </button>
        {buckets.map((b) => (
          <button
            key={b.category}
            type="button"
            onClick={() => onChange(b.category)}
            aria-pressed={active === b.category}
            className={pillClass(active === b.category)}
          >
            <span className="text-[11px] font-bold uppercase tracking-[.06em]">
              {ageLabel(b.category, t)}
            </span>
            <span className="text-[10px] font-semibold tabular-nums">{b.stock}</span>
          </button>
        ))}
      </div>
    </section>
  );
}