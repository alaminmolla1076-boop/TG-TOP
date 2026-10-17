import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import UsdtLogo from "@/components/account/UsdtLogo";

const PRESETS = [5, 10, 25, 50, 100, 250, 500, 1000];

export default function WithdrawAmountStep({ amount, preset, balance, onPick, onCustom, onMax, onNext }) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-[3px] shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-card">
            <UsdtLogo className="h-14 w-14" />
          </span>
        </span>
        <h2 className="font-heading text-2xl font-bold">How much USDT to withdraw?</h2>
        <p className="max-w-[270px] text-xs text-muted-foreground">
          Choose a preset amount or enter a custom one — you&apos;ll select the network next.
        </p>
        <p className="rounded-full bg-secondary/60 px-3 py-1 text-[11px] font-bold text-emerald-300">
          Available balance: {formatMoney(balance)}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {PRESETS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onPick(v)}
            className={`rounded-2xl border py-3.5 text-center text-base font-bold transition-all ${
              preset === v
                ? "border-transparent bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)]"
                : "border-border/50 bg-card hover:border-emerald-500/40"
            }`}
          >
            ${v}
          </button>
        ))}
      </div>

      <div className="grid gap-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom amount</p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-300">$</span>
          <Input
            type="number"
            min="1"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onCustom(e.target.value)}
            className="h-12 rounded-2xl border-border/50 bg-card pl-9 pr-24 text-lg font-bold focus-visible:ring-emerald-500/50"
          />
          <button
            type="button"
            onClick={onMax}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25"
          >
            Max
          </button>
        </div>
      </div>

      <Button
        type="button"
        onClick={onNext}
        disabled={!amount}
        className="h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] hover:from-emerald-600 hover:to-teal-600"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}