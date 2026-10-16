import React from "react";
import { Check, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = ["Amount", "Network", "Payment"];
const TITLES = ["Enter amount", "Choose how to pay", "Complete your top-up"];

export default function TopUpHeader({ step, onBack, onClose, disabled }) {
  return (
    <header className="space-y-5">
      <div className="flex items-center gap-3">
        {onBack && <Button variant="ghost" size="icon" onClick={onBack} disabled={disabled} aria-label="Back"><ChevronLeft /></Button>}
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-topup-soft">Top Up · Step {step + 1} of 3</p>
          <h1 className="mt-1 font-heading text-xl font-bold">{TITLES[step]}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} disabled={disabled} aria-label="Close top-up"><X /></Button>
      </div>
      <ol className="grid grid-cols-3 gap-2" aria-label="Top-up progress">
        {STEPS.map((label, index) => (
          <li key={label} aria-current={step === index ? "step" : undefined} className="space-y-2">
            <div className={index <= step ? "h-1 rounded-full bg-topup" : "h-1 rounded-full bg-secondary"} />
            <span className={index <= step ? "flex items-center gap-1.5 text-xs font-medium text-topup-soft" : "flex items-center gap-1.5 text-xs text-muted-foreground"}>
              {index < step ? <Check className="h-3 w-3" /> : <span>{index + 1}.</span>}{label}
            </span>
          </li>
        ))}
      </ol>
    </header>
  );
}