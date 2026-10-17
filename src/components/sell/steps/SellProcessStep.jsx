import React from "react";
import { ShieldCheck } from "lucide-react";

// Step 3: the system signs in, adds a secure 2FA password and moves the
// account into the seller's stock — this step shows that work in progress.
export default function SellProcessStep({ phone }) {
  return (
    <div className="grid gap-4 py-6 text-center">
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
        <ShieldCheck className="h-9 w-9 text-primary" strokeWidth={1.5} />
        <span className="absolute inset-0 animate-ping rounded-full border border-primary/30" />
      </div>
      <h2 className="font-heading text-2xl font-bold">Login + 2FA</h2>
      <p className="mx-auto max-w-[280px] text-xs text-muted-foreground">
        The system is signing in to{" "}
        <span className="font-semibold text-foreground">{phone}</span>, adding a secure 2FA password and moving
        the account to your stock. Keep the app open.
      </p>
      <p className="font-mono text-[11px] uppercase tracking-widest text-primary">Securing account…</p>
    </div>
  );
}