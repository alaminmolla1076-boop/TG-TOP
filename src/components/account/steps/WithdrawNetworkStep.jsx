import React from "react";
import { ChevronRight } from "lucide-react";
import { LOGOS } from "@/components/deposit/logos";

const NETWORKS = [
  { value: "BEP20", name: "BNB Chain", logo: LOGOS.BEP20, badge: "USDT BEP20", desc: "USDT on BNB Chain — low fees, fast confirmation" },
  { value: "POLYGON", name: "Polygon PoS", logo: LOGOS.POLYGON, badge: "USDT POLYGON", desc: "USDT on Polygon — very low fees" },
  { value: "TON", name: "TON Network", logo: LOGOS.TON, badge: "TON (GRAM)", desc: "Toncoin (formerly Gram) — sent to your TON address" },
];

export default function WithdrawNetworkStep({ amount, network, onSelect }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl font-bold">Select Network</h2>
        <p className="text-xs text-muted-foreground">
          You&apos;re withdrawing <span className="font-bold text-emerald-300">${amount}</span> — pick where to receive it.
        </p>
      </div>

      <div className="grid gap-2.5">
        {NETWORKS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onSelect(c.value)}
            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
              network === c.value
                ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)]"
                : "border-border/50 bg-card hover:border-emerald-500/40"
            }`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/60 p-2">
              <img src={c.logo} alt={c.name} className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{c.name}</p>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {c.badge}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Send only on the selected network — a wrong-network address can lose funds. USDT TRC20 and ERC20 withdrawals are no longer supported.
      </p>
    </div>
  );
}