import React from "react";
import { Send, Gift, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_URL = "https://t.me/tgtops";

const rowClass =
  "flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left no-underline " +
  "transition-colors duration-200 hover:bg-secondary/60 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring";

// Midnight Platinum — service list on a single surface.
export default function ServiceBand({ referralLink }) {
  const { toast } = useToast();

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Referral link copied", description: "Share it with friends to earn rewards." });
  }

  return (
    <nav className="og-rise overflow-hidden rounded-xl border border-border/50 bg-card/80 [animation-delay:700ms]">
      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={rowClass}>
        <Send className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.4} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">Follow Channel</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">Updates &amp; offers</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </a>
      <div aria-hidden className="h-px bg-border/40" />
      <button type="button" onClick={copyReferral} className={rowClass}>
        <Gift className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.4} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">Refer &amp; Earn</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">Copy invite link</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </nav>
  );
}