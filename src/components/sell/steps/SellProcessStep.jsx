import React from "react";
import { ShieldCheck } from "lucide-react";

// Step 3: the system signs in, adds a secure 2FA password and moves the
// account into the seller's stock — this step shows that work in progress.
export default function SellProcessStep({ phone }) {
  return (
    <div className="flex flex-col">
      <span
        aria-hidden
        className="relative grid h-11 w-11 place-items-center rounded-full border border-ring/30 bg-secondary/80 text-ring shadow-[0_0_24px_-10px_#6C5CE7]"
      >
        <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={1.7} />
        <span className="sf-bar-active absolute inset-0 rounded-full border border-ring/30" />
      </span>
      <h1 className="mb-2 mt-4 font-display text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-foreground">
        Login + 2FA
      </h1>
      <p className="m-0 text-[11px] leading-[1.55] text-muted-foreground">
        The system is signing in to{" "}
        <strong className="font-semibold text-foreground">{phone}</strong>, adding a secure 2FA password and moving
        the account to your stock. Keep the app open.
      </p>
      <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ring">
        Securing account…
      </p>
    </div>
  );
}