import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Capsule List — full-bleed dark band closing the page with the process steps.
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
        <h2 className="mt-1 font-heading text-2xl font-bold">{t("hi.title")}</h2>
      </div>
      {steps.map((s) => (
        <div
          key={s.no}
          className="flex items-center gap-3.5 rounded-[20px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] px-4 py-3.5"
        >
          <span className="text-[30px] font-bold leading-none text-[#A29BFE] tabular-nums">{s.no}</span>
          <div>
            <h3 className="text-[15px] font-medium text-foreground">{s.title}</h3>
            <p className="mt-1 text-[13px] leading-snug text-[#a8a3cf]">{s.desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}