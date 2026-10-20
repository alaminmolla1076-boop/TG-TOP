import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { AGE_OPTIONS, ageLabel } from "@/lib/accountAge";

const inputBase =
  "w-full rounded-2xl border border-ring/25 bg-secondary/80 px-4 text-base font-semibold text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_3px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50";
const primaryBtn =
  "h-12 w-full cursor-pointer rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] text-sm font-semibold text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-[opacity,box-shadow,transform] duration-200 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function SellPhoneStep({ phone, onPhone, age, onAge, onSubmit, busy }) {
  const { t } = useAppLang();
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <h1 className="mb-2 font-display text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-foreground">
        {t("sp.title")}
      </h1>
      <p className="m-0 text-[11px] leading-[1.55] text-muted-foreground">
        {t("sp.desc")}{" "}
        <strong className="font-semibold text-foreground">{t("sp.openApp")}</strong>
      </p>
      <div className="mt-5 grid gap-2">
        <label htmlFor="sell-phone" className="text-[11px] font-semibold text-foreground">
          {t("sp.label")}
        </label>
        <input
          id="sell-phone"
          type="text"
          inputMode="tel"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          placeholder="+8801XXXXXXXXX"
          disabled={busy}
          required
          className={`${inputBase} h-[52px]`}
        />
      </div>
      <div className="mt-2 grid gap-2">
        <label htmlFor="sell-age" className="text-[11px] font-semibold text-foreground">
          {t("sp.ageLabel")}
        </label>
        <select
          id="sell-age"
          value={age}
          onChange={(e) => onAge(e.target.value)}
          disabled={busy}
          className={`${inputBase} h-[52px] appearance-none`}
        >
          {AGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {ageLabel(o.value, t)}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-6 pt-4">
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? t("sp.sending") : t("sp.send")}
        </button>
      </div>
    </form>
  );
}