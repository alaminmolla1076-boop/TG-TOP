import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { AGE_OPTIONS, ageLabel } from "@/lib/accountAge";
import GlassSelect from "@/components/ui/GlassSelect";

export default function SellAgeSelect({ value, onChange, disabled, id = "sell-age" }) {
  const { t } = useAppLang();
  return (
    <div className="mt-3 grid gap-2">
      <label htmlFor={id} className="text-[11px] font-semibold text-foreground">{t("sp.ageLabel")}</label>
      <GlassSelect id={id} value={value} onChange={onChange} disabled={disabled} options={AGE_OPTIONS.map((option) => ({ value: option.value, label: ageLabel(option.value, t) }))} />
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("sp.ageNotice")}</p>
    </div>
  );
}