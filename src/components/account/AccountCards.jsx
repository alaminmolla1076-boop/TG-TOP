import React from "react";
import { Link } from "react-router-dom";
import { Coins, Wallet, Send, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_URL = "https://t.me/tgtops";

const tileClass =
  "flex flex-col items-center gap-1.5 rounded-2xl border border-[#2a3036] bg-[#1B1F23] px-1 py-3 text-center text-white no-underline " +
  "transition-[border-color,box-shadow,background] duration-200 hover:border-[#F39C12] hover:shadow-[0_0_14px_-4px_rgba(243,156,18,0.5)] active:bg-[#23282d] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F39C12]";
const actIcon = "h-6 w-6 text-[#F39C12]";
const actTitle = "text-[11.5px] font-semibold leading-tight";
const actSub = "text-[9px] leading-[1.3] text-[#9aa3ab]";

// Obsidian tile row — Top Up, Withdraw, Follow Channel, Refer & Earn.
export default function ActionCards({ referralLink, onWithdraw }) {
  const { toast } = useToast();

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Referral link copied", description: "Share it with friends to earn rewards." });
  }

  return (
    <nav className="og-rise-4 grid grid-cols-4 gap-2.5">
      <Link to="/deposit" className={tileClass}>
        <Coins className={actIcon} strokeWidth={1.2} />
        <span className={actTitle}>Top Up</span>
        <span className={actSub}>USDT, TON &amp; more</span>
      </Link>
      <button type="button" onClick={onWithdraw} className={tileClass}>
        <Wallet className={actIcon} strokeWidth={1.2} />
        <span className={actTitle}>Withdraw</span>
        <span className={actSub}>BEP20 · Polygon · TON</span>
      </button>
      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={tileClass}>
        <Send className={actIcon} strokeWidth={1.2} />
        <span className={actTitle}>Follow Channel</span>
        <span className={actSub}>Updates &amp; offers</span>
      </a>
      <button type="button" onClick={copyReferral} className={tileClass}>
        <Gift className={actIcon} strokeWidth={1.2} />
        <span className={actTitle}>Refer &amp; Earn</span>
        <span className={actSub}>Copy invite link</span>
      </button>
    </nav>
  );
}