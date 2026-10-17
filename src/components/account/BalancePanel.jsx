import React from "react";
import { Link } from "react-router-dom";
import { Coins, Wallet } from "lucide-react";
import { useCountUp } from "@/components/account/useCountUp";
import { formatMoney } from "@/lib/format";

const actionClass =
  "flex w-full cursor-pointer items-center gap-3.5 rounded-xl border border-border/50 bg-card/80 px-4 py-3.5 text-left text-foreground no-underline " +
  "transition-colors duration-200 hover:border-primary/50 hover:bg-card " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Vault Card — balance hero on a brushed-obsidian surface with a drifting
// light sweep, and the Top Up / Withdraw command rows embedded beneath it.
export default function BalancePanel({ data, onWithdraw }) {
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);

  return (
    <section className="og-rise relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-obsidian to-card p-6 shadow-lg [animation-delay:250ms]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="vg-sweep absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      <div className="relative">
        <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          USDT Balance
        </span>
        <p className="ca-glow mt-1.5 font-display text-5xl font-bold leading-none text-primary">
          {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Available for trading &amp; withdrawals
        </p>

        <div className="mt-6 flex flex-col gap-2.5 border-t border-border/40 pt-5">
          <Link to="/deposit" className={actionClass}>
            <Coins className="h-[22px] w-[22px] shrink-0 text-primary" strokeWidth={1.4} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold uppercase tracking-widest">Top Up</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">USDT, TON &amp; more</span>
            </span>
          </Link>
          <button type="button" onClick={onWithdraw} className={actionClass}>
            <Wallet className="h-[22px] w-[22px] shrink-0 text-primary" strokeWidth={1.4} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold uppercase tracking-widest">Withdraw</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">BEP20 · Polygon · TON</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}