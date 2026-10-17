import React from "react";
import { Link } from "react-router-dom";
import { Coins, Wallet } from "lucide-react";
import { useCountUp } from "@/components/account/useCountUp";
import { formatMoney } from "@/lib/format";

const COPPER_URL =
  "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/f54a0d463_generated_e348f0e1.jpg";

const rowClass =
  "flex w-full cursor-pointer items-center gap-3.5 rounded-xl bg-[#2B1C16] px-4 py-4 text-left text-[#F1E3D4] no-underline " +
  "shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)] transition-[background,box-shadow] duration-200 " +
  "hover:bg-[#3a271e] hover:shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),0_0_14px_-4px_rgba(196,139,104,0.7)] active:bg-[#22150f] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1E3D4]";

// Copper Atelier — balance instrument panel with brushed-copper surface,
// stamped corner and the Top Up / Withdraw command rows embedded beneath it.
export default function BalancePanel({ data, onWithdraw }) {
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);

  return (
    <section className="og-rise relative overflow-hidden rounded-[18px] bg-[#75513E] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.6)] [animation-delay:250ms]">
      <img
        src={COPPER_URL}
        alt=""
        aria-hidden="true"
        className="ca-glow pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(43,28,22,0.55)] to-[rgba(43,28,22,0.82)]" />
      <div className="absolute right-0 top-0 h-[74px] w-[74px] rounded-bl-[74px] bg-[#C48B68] shadow-[inset_-6px_6px_14px_rgba(43,28,22,0.55),inset_2px_-2px_6px_rgba(241,227,212,0.35)]" />

      <div className="relative flex flex-col gap-3 px-5 pb-[18px] pt-[22px]">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F1E3D4]">
          USDT Balance
        </span>
        <p className="font-mono text-[54px] font-medium leading-[1.15] text-[#F1E3D4]">
          {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
        </p>
        <p className="text-[11px] leading-snug text-[#e0cdb9]">
          Available for trading &amp; withdrawals
        </p>

        <div className="mt-1.5 flex flex-col gap-2">
          <Link to="/deposit" className={rowClass}>
            <Coins className="h-[26px] w-[26px] shrink-0 text-[#C48B68]" strokeWidth={1.3} />
            <span className="min-w-0">
              <span className="block font-mono text-sm font-semibold uppercase tracking-[0.14em]">Top Up</span>
              <span className="mt-[3px] block text-[11px] text-[#C48B68]">USDT, TON &amp; more</span>
            </span>
          </Link>
          <button type="button" onClick={onWithdraw} className={rowClass}>
            <Wallet className="h-[26px] w-[26px] shrink-0 text-[#C48B68]" strokeWidth={1.3} />
            <span className="min-w-0">
              <span className="block font-mono text-sm font-semibold uppercase tracking-[0.14em]">Withdraw</span>
              <span className="mt-[3px] block text-[11px] text-[#C48B68]">BEP20 · Polygon · TON</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}