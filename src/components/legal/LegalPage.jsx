import React from "react";
import { FileText } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Shared layout for legal documents (Privacy Policy, Terms & Conditions),
// rendered in the app's capsule style so every legal page looks consistent.
export default function LegalPage({ eyebrow, title, intro, sections }) {
  const { t } = useAppLang();
  return (
    <div className="mk-sec flex flex-col gap-4 pb-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)]">
          <FileText className="h-5 w-5 text-[#A29BFE]" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A29BFE]">{eyebrow}</p>
          <h1 className="font-heading text-lg font-bold text-foreground">{title}</h1>
        </div>
      </div>

      <div className="rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-[18px] text-[13px] leading-relaxed text-[#a8a3cf]">
        {intro}
      </div>

      {sections.map((s) => (
        <section
          key={s.heading}
          className="rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-[18px]"
        >
          <h2 className="text-[15px] font-semibold text-foreground">{s.heading}</h2>
          {s.body?.map((p, i) => (
            <p key={i} className="mt-2 text-[13px] leading-relaxed text-[#a8a3cf]">
              {p}
            </p>
          ))}
          {s.bullets?.length ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-[13px] leading-relaxed text-[#a8a3cf]">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#A29BFE]" />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <p className="px-1 text-center text-[11px] text-muted-foreground">
        {t("legal.questions")}
      </p>
    </div>
  );
}