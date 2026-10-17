import React from "react";
import { Send, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_URL = "https://t.me/tgtops";

const svcClass =
  "flex cursor-pointer flex-col gap-[5px] rounded-xl bg-[#e6d2bd] px-3.5 py-4 text-left text-[#2B1C16] no-underline " +
  "shadow-[inset_0_2px_5px_rgba(117,81,62,0.35)] transition-[background,box-shadow] duration-200 " +
  "hover:bg-[#dcc3a8] hover:shadow-[inset_0_2px_5px_rgba(117,81,62,0.5),0_0_10px_-3px_rgba(117,81,62,0.6)] active:bg-[#cfb392] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1E3D4]";

// Copper Atelier — pale-copper service band: Follow Channel, Refer & Earn.
export default function ServiceBand({ referralLink }) {
  const { toast } = useToast();

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Referral link copied", description: "Share it with friends to earn rewards." });
  }

  return (
    <nav className="og-rise grid grid-cols-2 gap-2.5 rounded-2xl bg-[#F1E3D4] p-3 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)] [animation-delay:700ms]">
      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={svcClass}>
        <Send className="h-6 w-6 text-[#75513E]" strokeWidth={1.3} />
        <span className="block font-mono text-[12.5px] font-semibold uppercase tracking-[0.14em]">Follow Channel</span>
        <span className="block text-[11px] text-[#75513E]">Updates &amp; offers</span>
      </a>
      <button type="button" onClick={copyReferral} className={svcClass}>
        <Gift className="h-6 w-6 text-[#75513E]" strokeWidth={1.3} />
        <span className="block font-mono text-[12.5px] font-semibold uppercase tracking-[0.14em]">Refer &amp; Earn</span>
        <span className="block text-[11px] text-[#75513E]">Copy invite link</span>
      </button>
    </nav>
  );
}