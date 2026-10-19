import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { LOGOS } from "@/components/deposit/logos";
import { useAppLang } from "@/lib/AppLanguageContext";

const PRESETS = [5, 10, 25, 50, 100, 250, 500, 1000];

export default function WithdrawAmountStep({ amount, preset, balance, onPick, onCustom, onMax, onNext }) {
  const { t } = useAppLang();
  return (
    <div className="grid gap-6">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-[3px] shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-card">
            <img src={LOGOS.usdt} alt="USDT" className="h-14 w-14" />
          </span>
        </span>
        <h2 className="font-heading text-2xl font-bold">{t("wa.title")}</h2>
        <p className="max-w-[270px] text-xs text-muted-foreground">
          {t("wa.desc")}
        </p>
        <p className="rounded-full bg-secondary/60 px-3 py-1 text-[11px] font-bold text-primary">
          {t("wa.balance", { balance: formatMoney(balance) })}
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
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border/50 bg-card hover:border-primary/40"
            }`}
          >
            ${v}
          </button>
        ))}
      </div>

      <div className="grid gap-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("c.customAmount")}</p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">$</span>
          <Input
            type="number"
            min="3"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onCustom(e.target.value)}
            className="h-12 rounded-2xl border-border/50 bg-card pl-9 pr-24 text-lg font-bold focus-visible:ring-ring/50"
          />
          <button
            type="button"
            onClick={onMax}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/25"
          >
            {t("c.max")}
          </button>
        </div>
      </div>

      <Button
        type="button"
        onClick={onNext}
        disabled={!amount}
        className="h-12 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        {t("c.continue")} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}