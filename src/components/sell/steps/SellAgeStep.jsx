import React from "react";
import { Check } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { AGE_OPTIONS, ageLabel } from "@/lib/accountAge";

const primaryBtn =
  "h-12 w-full cursor-pointer rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] text-sm font-semibold text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-[opacity,box-shadow,transform] duration-200 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";
const optionBase =
  "flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-[13px] font-semibold transition-colors duration-200";
const optionActive = "border-ring bg-[rgba(108,92,231,.24)] text-[#C9C4FF]";
const optionIdle = "border-ring/20 bg-secondary/60 text-foreground hover:border-ring/45";

// First sell step: the seller must fix the account age before anything else,
// so a sale can only start from an age choice.
export default function SellAgeStep({ age, onAge, onNext }) {
  const { t } = useAppLang();
  return (
    <form onSubmit={onNext} className="flex flex-col">
      <h1 className="mb-2 font-display text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-foreground">
        {t("sw.ageTitle")}
      </h1>
      <p className="m-0 text-[11px] leading-[1.55] text-muted-foreground">{t("sw.ageDesc")}</p>
      <div className="mt-5 grid max-h-[44vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {AGE_OPTIONS.map((option) => {
          const active = age === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onAge(option.value)}
              aria-pressed={active}
              className={optionBase + " " + (active ? optionActive : optionIdle)}
            >
              <span className="truncate">{ageLabel(option.value, t)}</span>
              {active && <Check className="h-4 w-4 shrink-0" strokeWidth={2.4} />}
            </button>
          );
        })}
      </div>
      <div className="mt-6 pt-4">
        <button type="submit" disabled={!age} className={primaryBtn}>
          {t("sw.ageContinue")}
        </button>
      </div>
    </form>
  );
}
