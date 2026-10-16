import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { LOGOS } from "../logos";

const CHAINS = [
  { value: "TRC20", name: "Tron", logo: LOGOS.TRC20, desc: "USDT on Tron — low fees, fast confirmation" },
  { value: "ERC20", name: "Ethereum", logo: LOGOS.ERC20, desc: "USDT on Ethereum — higher gas fees" },
  { value: "BEP20", name: "BNB Chain", logo: LOGOS.BEP20, desc: "USDT on BNB Chain — low fees, fast confirmation" },
];

export default function NetworkStep({ amount, network, onSelect, onNext }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl font-bold">Select Network</h2>
        <p className="text-xs text-muted-foreground">
          You&apos;re sending <span className="font-bold text-emerald-300">${amount} USDT</span> — pick the network your wallet supports.
        </p>
      </div>

      <div className="grid gap-2.5">
        {CHAINS.map((c) => (
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
                  USDT {c.value}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
            </div>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                network === c.value ? "bg-emerald-500 text-white" : "border border-border"
              }`}
            >
              {network === c.value && <Check className="h-4 w-4" />}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        AVAX network is coming soon. Top-ups are verified automatically on-chain — no TXID needed.
      </p>

      <Button
        type="button"
        onClick={onNext}
        disabled={!network}
        className="h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] hover:from-emerald-600 hover:to-teal-600"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}