import React from "react";
import { Send, Gift, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_URL = "https://t.me/tgtops";

const rowClass =
  "flex w-full cursor-pointer items-center gap-3 rounded-full border border-ring/[.28] bg-secondary/80 px-[18px] py-[13px] text-left no-underline text-foreground " +
  "shadow-[0_8px_20px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.08)] " +
  "transition-[background-color,box-shadow] duration-200 hover:bg-accent/90 hover:shadow-[0_10px_24px_rgba(108,92,231,.3)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Nordic Frost Glass — floating lozenge shortcuts.
export default function ServiceBand({ referralLink }) {
  const { toast } = useToast();

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Referral link copied", description: "Share it with friends to earn rewards." });
  }

  return (
    <nav className="og-rise flex flex-col gap-2.5 [animation-delay:.7s]">
      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={rowClass}>
        <Send className="h-5 w-5 shrink-0 text-ring" strokeWidth={1.5} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">Follow Channel</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">Updates &amp; offers</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#8d88b4]" strokeWidth={2} />
      </a>
      <button type="button" onClick={copyReferral} className={rowClass}>
        <Gift className="h-5 w-5 shrink-0 text-ring" strokeWidth={1.5} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">Refer &amp; Earn</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">Copy invite link</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#8d88b4]" strokeWidth={2} />
      </button>
    </nav>
  );
}