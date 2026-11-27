import React from "react";
import { Users } from "lucide-react";
import SectionHead from "./SectionHead";
import SellerCard from "./SellerCard";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market — seller directory as a two-column card grid. Each card opens the
// seller's own country-stock page (page-based, not an accordion).
export default function SellerList({ sellers, query }) {
  const { t } = useAppLang();
  return (
    <section id="mk-sellers" className="mk-sec flex scroll-mt-24 flex-col gap-3">
      <SectionHead
        icon={<Users className="h-4 w-4" strokeWidth={1.6} />}
        title={t("mk.sellers")}
        badge={t("mk.sellersCount", { n: sellers?.length ?? 0 })}
      />
      {sellers === null ? (
        <p className="text-[13px] text-[#8B93A7]">{t("c.loading")}</p>
      ) : sellers.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[.02] p-[18px] text-[13px] text-[#8B93A7]">
          {query ? t("mk.searchNone", { query }) : t("mk.noSellers")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {sellers.map((s, i) => (
            <SellerCard key={s.id} seller={s} tone={["blue", "purple", "amber"][i % 3]} />
          ))}
        </div>
      )}
    </section>
  );
}
