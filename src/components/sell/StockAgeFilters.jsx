import React from "react";
import GlassSelect from "@/components/ui/GlassSelect";
import { AGE_OPTIONS, ageLabel } from "@/lib/accountAge";
import { useAppLang } from "@/lib/AppLanguageContext";

export default function StockAgeFilters({ countries, country, age, onCountry, onAge }) {
  const { t } = useAppLang();
  return (
    <div className="grid grid-cols-2 gap-2">
      <GlassSelect id="price-country" value={country} onChange={onCountry}
        placeholder={t("sl.countryStock")}
        options={[{ value: "", label: t("s1.allCountries") }, ...countries.map((item) => ({
          value: item.country_iso, label: `${item.flag || ""} ${item.country_name || item.country_iso}`,
        }))]} triggerClass="h-11 text-xs" />
      <GlassSelect id="price-age" value={age} onChange={onAge} disabled={!country}
        placeholder={t("sp.ageLabel")}
        options={[{ value: "", label: t("ag.all") }, ...AGE_OPTIONS.map((option) => ({
          value: option.value, label: ageLabel(option.value, t),
        }))]} triggerClass="h-11 text-xs" />
    </div>
  );
}