import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { LOGOS } from "@/components/deposit/logos";

const PRESETS = [5, 10, 25, 50, 100, 250, 500, 1000];

export default function AmountStep({ amount, preset, onPick, onCustom, onNext }) {
  const valid = Number.isFinite(Number(amount)) && Number(amount) >= 1;
  return (
    <div className="grid gap-6">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl border border-topup/25 bg-topup/10">
          <img src={LOGOS.usdt} alt="USDT" className="h-12 w-12" />
        </span>
        <div><h2 className="font-heading text-2xl font-bold">How much to top up?</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Enter your amount. Choose a network or connect Keeper on the next page.</p></div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((value) => (
          <button key={value} type="button" onClick={() => onPick(value)} aria-pressed={preset === value}
            className={preset === value ? "rounded-xl border border-topup bg-topup/15 py-3 text-sm font-bold text-topup-soft" : "rounded-xl border border-border bg-card py-3 text-sm font-bold hover:border-topup/50"}>${value}</button>
        ))}
      </div>
      <div className="space-y-2">
        <label htmlFor="topup-amount" className="text-xs font-medium text-muted-foreground">Custom amount (USD)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-topup-soft">$</span>
          <Input id="topup-amount" type="number" inputMode="decimal" min="1" step="0.01" placeholder="0.00" value={amount} onChange={(event) => onCustom(event.target.value)} className="h-16 rounded-2xl border-border bg-card pl-10 pr-4 text-2xl font-bold focus-visible:ring-topup" />
        </div>
        <p className="text-[11px] text-muted-foreground">Minimum top-up: $1</p>
      </div>
      <Button type="button" onClick={onNext} disabled={!valid} className="h-12 rounded-xl bg-topup text-base font-semibold text-topup-foreground hover:bg-topup/90">Continue to network <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}