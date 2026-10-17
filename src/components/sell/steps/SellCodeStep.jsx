import React from "react";
import { KeyRound } from "lucide-react";

const iconBadge =
  "grid h-11 w-11 place-items-center rounded-full border border-ring/30 bg-secondary/80 text-ring shadow-[0_0_24px_-10px_#6C5CE7]";
const inputBase =
  "w-full rounded-2xl border border-ring/25 bg-secondary/80 px-4 text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_3px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50";
const primaryBtn =
  "h-12 w-full cursor-pointer rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] text-sm font-semibold text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-[opacity,box-shadow,transform] duration-200 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function SellCodeStep({ phone, code, onCode, onSubmit, ready = false }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <span aria-hidden className={iconBadge}>
        <KeyRound className="h-[22px] w-[22px]" strokeWidth={1.7} />
      </span>
      <h1 className="mb-2 mt-4 font-display text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-foreground">
        Enter the login code
      </h1>
      <p className="m-0 text-[11px] leading-[1.55] text-muted-foreground">
        Enter the code from Telegram for{" "}
        <strong className="font-semibold text-foreground">{phone}</strong>.
      </p>
      <div className="mt-5 grid gap-2">
        <label htmlFor="sell-code" className="text-[11px] font-semibold text-foreground">
          Login Code
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
      <div className="mt-6 pt-4">
        <button type="submit" disabled={!code.trim() || !ready} className={primaryBtn}>
          Verify &amp; continue
        </button>
      </div>
    </form>
  );
}