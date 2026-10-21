import React from "react";
import { Hourglass } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { AGE_OPTIONS, ageLabel } from "@/lib/accountAge";
import SectionHead from "@/components/market/SectionHead";
import SellerCountryCard from "@/components/market/SellerCountryCard";

export default function SellerAgeStock({ seller, pool }) {
  const { t } = useAppLang();
  const field = pool === "spam" ? "spam_stock" : "nonspam_stock";
  const groups = (seller.age_groups || [])
    .filter((group) => Number(group[field]) > 0)
    .sort((a, b) => AGE_OPTIONS.findIndex((o) => o.value === a.category) - AGE_OPTIONS.findIndex((o) => o.value === b.category));
  if (!groups.length) return <p className="rounded-2xl border border-dashed border-ring/25 bg-card/60 p-4 text-sm text-muted-foreground">{t(pool === "spam" ? "sl.noSpamStock" : "sl.noNonSpamStock")}</p>;
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.category} className="flex flex-col gap-2.5" aria-label={ageLabel(group.category, t)}>
          <SectionHead
            icon={<Hourglass className="h-4 w-4" strokeWidth={1.5} />}
            title={ageLabel(group.category, t)}
            badge={t("s1.poolStock", { n: group[field] })}
          />
          {group.countries.filter((country) => Number(country[field]) > 0).map((country) => (
            <SellerCountryCard key={`${country.country_iso}|${group.category}`} sellerId={seller.id} country={country} pool={pool} age={group.category} />
          ))}
        </section>
      ))}
    </div>
  );
}