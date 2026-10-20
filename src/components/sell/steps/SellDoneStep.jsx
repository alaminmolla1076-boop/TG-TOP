import React from "react";
import { PackageCheck } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";

const iconBadge =
  "grid h-11 w-11 place-items-center rounded-full border border-ring/30 bg-secondary/80 text-ring shadow-[0_0_24px_-10px_#6C5CE7]";

export default function SellDoneStep({ result, onReset }) {
  const { t } = useAppLang();
  const [descA, descB] = t("sd.desc", {
    phone: "\u0001",
    pool: t(result?.spam ? "sd.spam" : "sd.nonSpam"),
  }).split("\u0001");
  return (
    <div className="flex flex-col">
      <span aria-hidden className={iconBadge}>
        <PackageCheck className="h-[22px] w-[22px]" strokeWidth={1.7} />
      </span>
      <h1 className="mb-2 mt-4 font-display text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-foreground">
        {t("sd.title")}
      </h1>
      <p className="m-0 text-[11px] leading-[1.55] text-muted-foreground">
        {result?.country ? `${result.country} · ` : ""}
        {descA}
        <strong className="font-semibold text-foreground">{result?.phone}</strong>
        {descB}
      </p>
      {result?.age_category ? (
        <span className="mt-2.5 inline-flex w-fit items-center rounded-full border border-ring/35 bg-ring/[.12] px-2.5 py-1 text-[11px] font-semibold text-ring">
          {t("sd.age")}: {ageLabel(result.age_category, t)}
        </span>
      ) : null}
      <div className="mt-6 pt-4">
        <button
          type="button"
          onClick={onReset}
          className="h-12 w-full cursor-pointer rounded-full border border-ring/40 bg-ring/[.14] text-sm font-semibold text-[#C9C4FF] transition-[opacity,background-color] duration-200 hover:bg-ring/[.24] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t("sd.another")}
        </button>
      </div>
    </div>
  );
}