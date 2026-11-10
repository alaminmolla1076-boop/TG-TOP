import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market — the simple-process band closing the page.
export default function HowItWorksBand() {
  const { t } = useAppLang();
  const steps = [
    { no: "01", title: t("hi.s1t"), desc: t("hi.s1d") },
    { no: "02", title: t("hi.s2t"), desc: t("hi.s2d") },
    { no: "03", title: t("hi.s3t"), desc: t("hi.s3d") },
    { no: "04", title: t("hi.s4t"), desc: t("hi.s4d") },
  ];

  return (
    <section className="mk-sec -mx-4 flex flex-col gap-3.5 border-y border-[#A29BFE]/15 bg-[rgba(10,9,17,.7)] px-4 py-[22px]">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#A29BFE]">
          {t("hi.badge")}
        </div>
        <h2 className="mt-1 font-heading text-2xl font-bold text-white">{t("hi.title")}</h2>
      </div>
      <div className="grid gap-2.5 lg:grid-cols-2">
        {steps.map((s) => (
          <div
            key={s.no}
            className="flex items-center gap-3.5 rounded-[22px] border border-[#A29BFE]/25 bg-[linear-gradient(140deg,rgba(60,48,110,.6),rgba(28,24,46,.85))] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
          >
            <span className="bg-[linear-gradient(150deg,#A29BFE,#6C5CE7)] bg-clip-text font-display text-[30px] font-bold leading-none tabular-nums text-transparent">
              {s.no}
            </span>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-[12px] leading-snug text-[#a8a3cf]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
