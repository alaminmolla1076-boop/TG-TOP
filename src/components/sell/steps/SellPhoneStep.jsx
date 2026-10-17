import React from "react";
import { Smartphone } from "lucide-react";

export default function SellPhoneStep({ phone, onPhone, onSubmit, busy }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <span
        aria-hidden
        className="grid h-11 w-11 place-items-center rounded-full border border-[#735224] bg-[#30271D] text-primary shadow-[0_0_24px_-10px_#FFAA33]"
      >
        <Smartphone className="h-[22px] w-[22px]" strokeWidth={1.7} />
      </span>
      <h1 className="mb-2 mt-4 font-display text-[28px] font-normal leading-[1.08] tracking-[-0.035em]">
        Your number
      </h1>
      <p className="m-0 text-[11px] leading-[1.55] text-[#B8ADA2]">
        We will send a Telegram login code to this number.{" "}
        <strong className="font-semibold text-white">Open that Telegram app to read it.</strong>
      </p>
      <div className="mt-5 grid gap-2">
        <label htmlFor="sell-phone" className="text-[11px] font-semibold text-[#E8DFD6]">
          Telegram Phone Number
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
          className="w-full rounded-[13px] border border-[#66594B] bg-[#2E2A28] px-4 text-base font-semibold text-white placeholder:text-[#82776C] transition-[border-color,box-shadow] duration-[180ms] ease-[ease] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_#FFAA3325] disabled:cursor-not-allowed disabled:opacity-50 h-[52px]"
        />
      </div>
      <div className="mt-6 pt-4">
        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full cursor-pointer rounded-full bg-primary text-sm font-semibold text-[#24201E] shadow-[0_8px_20px_#FFAA3324] transition-[background-color,box-shadow,transform] duration-[180ms] ease-[ease] hover:bg-[#FFB84F] hover:shadow-[0_9px_24px_#FFAA3344] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFAA33] focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Sending code…" : "Send login code"}
        </button>
      </div>
    </form>
  );
}