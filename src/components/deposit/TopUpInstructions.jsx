import React from "react";
import { AlertTriangle } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

export default function TopUpInstructions({ network }) {
  const { t } = useAppLang();
  const steps = [
    {
      title: t("ti.s1t"),
      text: t("ti.s1d", { network }),
    },
    {
      title: t("ti.s2t"),
      text: t("ti.s2d"),
    },
    {
      title: t("ti.s3t"),
      text: t("ti.s3d"),
    },
    {
      title: t("ti.s4t"),
      text: t("ti.s4d"),
    },
  ];

  return (
    <div className="grid gap-3 rounded-2xl border border-border/50 bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">{t("ti.title")}</p>
      <ol className="grid gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-xs text-red-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        {t("ti.warn")}
      </p>
    </div>
  );
}