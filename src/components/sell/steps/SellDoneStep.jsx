import React from "react";
import { PackageCheck } from "lucide-react";

export default function SellDoneStep({ result, onReset }) {
  return (
    <div className="flex flex-col">
      <span
        aria-hidden
        className="grid h-11 w-11 place-items-center rounded-full border border-[#735224] bg-[#30271D] text-primary shadow-[0_0_24px_-10px_#FFAA33]"
      >
        <PackageCheck className="h-[22px] w-[22px]" strokeWidth={1.7} />
      </span>
      <h1 className="mb-2 mt-4 font-display text-[28px] font-normal leading-[1.08] tracking-[-0.035em]">
        In your stock
      </h1>
      <p className="m-0 text-[11px] leading-[1.55] text-[#B8ADA2]">
        {result?.country ? `${result.country} · ` : ""}
        <strong className="font-semibold text-white">{result?.phone}</strong> is now in your stock with a
        system 2FA password.
      </p>
      <div className="mt-6 pt-4">
        <button
          type="button"
          onClick={onReset}
          className="h-12 w-full cursor-pointer rounded-full border border-[#66594B] bg-[#2E2A28] text-sm font-semibold text-white transition-[background-color,box-shadow,transform] duration-[180ms] ease-[ease] hover:bg-[#39322D] hover:shadow-[0_0_14px_#FFAA3333] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFAA33] focus-visible:outline-offset-[3px]"
        >
          Sell another account
        </button>
      </div>
    </div>
  );
}