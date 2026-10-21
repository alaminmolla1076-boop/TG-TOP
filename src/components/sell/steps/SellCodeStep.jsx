import React from "react";
import { ChevronLeft, KeyRound } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import SellAgeSelect from "@/components/sell/SellAgeSelect";

const inputBase =
  "w-full rounded-2xl border border-ring/25 bg-secondary/80 px-4 text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_3px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50";
const primaryBtn =
  "h-12 w-full cursor-pointer rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] text-sm font-semibold text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-[opacity,box-shadow,transform] duration-200 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function SellCodeStep({ phone, code, onCode, age, onAge, onSubmit, ready = false, onBack }) {
  const { t } = useAppLang();
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <h1 className="mb-2 font-display text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-foreground">
        {t("sc.title")}
      </h1>
      <p className="m-0 text-[11px] leading-[1.55] text-muted-foreground">
        {t("sc.desc")}{" "}
        <strong className="font-semibold text-foreground">{phone}</strong>.
      </p>
      <div className="mt-5 grid gap-2">
        <label htmlFor="sell-code" className="text-[11px] font-semibold text-foreground">
          {t("sc.label")}
        </label>
        <input
          id="sell-code"
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => onCode(e.target.value)}
          placeholder="• • • • •"
          disabled={!ready}
          required
          className={`${inputBase} h-[52px] text-center text-lg font-bold tracking-[0.34em]`}
        />
      </div>
      <SellAgeSelect id="sell-code-age" value={age} onChange={onAge} disabled={!ready} />
      <div className="mt-6 pt-4">
        <button type="submit" disabled={!code.trim() || !ready} className={primaryBtn}>
          {t("sc.verify")}
        </button>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:text-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} /> {t("sc.change")}
          </button>
        )}
      </div>
    </form>
  );
}