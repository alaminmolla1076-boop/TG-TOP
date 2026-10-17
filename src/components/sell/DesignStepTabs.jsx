import React from "react";
import { Check } from "lucide-react";

const ROMAN = ["I", "II", "III", "IV"];

// Premium step-indicator skins for the Sell wizard — one per design variant.
export default function DesignStepTabs({ steps, stepIndex, variant }) {
  if (variant === "focus") {
    return (
      <ol className="flex gap-1.5 rounded-full border border-border/50 bg-muted/30 p-1.5">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li key={s.key} className="flex-1">
              <span
                className={`block h-2 rounded-full ${
                  done || active
                    ? "bg-primary shadow-[0_0_12px_-2px_hsl(var(--primary))]"
                    : "bg-border/70"
                }`}
              />
              <span
                className={`mt-1.5 block text-center text-[10px] leading-tight ${
                  done || active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  if (variant === "ribbon") {
    return (
      <ol className="grid grid-cols-4 gap-1 border-b border-border/60">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li
              key={s.key}
              className={`-mb-px border-b-2 pb-2 text-center text-[11px] leading-tight ${
                active
                  ? "border-primary text-primary"
                  : done
                    ? "border-primary/40 text-foreground/80"
                    : "border-transparent text-muted-foreground"
              }`}
            >
              {s.label}
            </li>
          );
        })}
      </ol>
    );
  }

  if (variant === "vault") {
    return (
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li
              key={s.key}
              className={`rounded-lg border p-2 text-center outline outline-1 outline-border/60 ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : done
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border/50 bg-muted/20"
              }`}
            >
              <span
                className={`text-[10px] font-bold tracking-widest ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {ROMAN[i]}
              </span>
              <span
                className={`mt-1 block text-[10px] leading-tight ${
                  done || active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  // concierge — room-key pill rail
  return (
    <ol className="flex gap-2">
      {steps.map((s, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        const Icon = s.icon;
        return (
          <li
            key={s.key}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] leading-none ${
              active
                ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_20px_-8px_hsl(var(--primary))]"
                : done
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-border/50 bg-muted/20 text-muted-foreground"
            }`}
          >
            {done ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}