import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Gift } from "lucide-react";

// Referral card with a gradient header and a copy button that pulses on copy.
export default function ReferralCard({ referralLink }) {
  const [copied, setCopied] = useState(false);

  function copyReferral() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-card">
      <div className="flex items-center gap-3 border-b border-border/50 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold">Refer & Earn</h2>
          <p className="text-xs text-muted-foreground">
            Share this link — friends who join through it earn you a referral reward.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-4">
        <p className="min-w-0 flex-1 truncate rounded-xl bg-emerald-500/10 px-3 py-2.5 font-mono text-xs text-emerald-100/90">
          {referralLink}
        </p>
        <Button
          type="button"
          size="icon"
          onClick={copyReferral}
          aria-label="Copy referral link"
          className="shrink-0 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
        >
          {copied ? <Check className="animate-pulse" /> : <Copy />}
        </Button>
      </div>
    </section>
  );
}