import React from "react";
import { Hourglass } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";

export default function AccountAgeSummary({ result }) {
  const { t } = useAppLang();
  if (!result?.age_category) return null;
  return (
    <div className="mt-3 rounded-2xl border border-ring/30 bg-primary/10 p-3.5">
      <div className="flex items-center gap-3">
        <Hourglass className="h-5 w-5 shrink-0 text-ring" />
        <div>
          <p className="text-[11px] text-muted-foreground">{t("sd.age")}</p>
          <p className="mt-0.5 text-base font-semibold text-foreground">{ageLabel(result.age_category, t)}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {t("ag.estimated")}
      </p>
    </div>
  );
}