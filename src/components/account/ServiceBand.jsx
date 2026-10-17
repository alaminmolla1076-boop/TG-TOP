import React from "react";
import { Send, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_URL = "https://t.me/tgtops";

const svcClass =
  "flex cursor-pointer flex-col gap-2 rounded-xl border border-border/50 bg-card/80 px-4 py-4 text-left text-foreground no-underline " +
  "transition-colors duration-200 hover:border-primary/50 hover:bg-card " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Vault Card — dark service band: Follow Channel, Refer & Earn.
export default function ServiceBand({ referralLink }) {
  const { toast } = useToast();

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Referral link copied", description: "Share it with friends to earn rewards." });
  }

  return (
    <nav className="og-rise grid grid-cols-2 gap-2.5 [animation-delay:700ms]">
      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={svcClass}>
        <Send className="h-5 w-5 text-primary" strokeWidth={1.4} />
        <span className="block text-xs font-semibold uppercase tracking-widest">Follow Channel</span>
        <span className="block text-[11px] text-muted-foreground">Updates &amp; offers</span>
      </a>
      <button type="button" onClick={copyReferral} className={svcClass}>
        <Gift className="h-5 w-5 text-primary" strokeWidth={1.4} />
        <span className="block text-xs font-semibold uppercase tracking-widest">Refer &amp; Earn</span>
        <span className="block text-[11px] text-muted-foreground">Copy invite link</span>
      </button>
    </nav>
  );
}