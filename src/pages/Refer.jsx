import React, { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";

export default function Refer() {
  const { identity } = useTgIdentity();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = identity?.telegram_id
    ? `https://t.me/tgtopsbot?startapp=${identity.telegram_id}`
    : "";

  async function copy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Referral link copied", description: "Share it with friends to earn rewards." });
    } catch {
      toast({ title: "Copy failed", description: "Select the link to copy it manually.", variant: "destructive" });
    }
  }

  return (
    <div className="mk-sec flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)]">
          <Gift className="h-5 w-5 text-[#A29BFE]" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A29BFE]">Refer</p>
          <h1 className="font-heading text-lg font-bold text-foreground">Refer &amp; Earn</h1>
        </div>
      </div>

      <div className="rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-[18px] text-[13px] leading-relaxed text-[#a8a3cf]">
        Share your invite link with friends. When they join TG TOP through it,
        you earn rewards.
      </div>

      {referralLink ? (
        <div className="flex gap-2">
          <p className="min-w-0 flex-1 truncate rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-4 py-[13px] font-mono text-[12px] text-[#a8a3cf]">
            {referralLink}
          </p>
          <button
            type="button"
            onClick={copy}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-[18px] text-xs font-semibold text-[#A29BFE] transition-[border-color] duration-200 hover:border-[#A29BFE]/70"
          >
            {copied ? <Check className="h-4 w-4" strokeWidth={1.5} /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
            Copy
          </button>
        </div>
      ) : (
        <p className="text-[13px] text-[#a8a3cf]">Open the app from Telegram to get your invite link.</p>
      )}
    </div>
  );
}