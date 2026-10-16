import React from "react";
import { Link } from "react-router-dom";
import { Coins, Wallet, Send, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_URL = "https://t.me/tgtops";

const actClass =
  "flex flex-col items-center gap-1.5 rounded-[14px] px-[3px] py-1.5 text-center text-white no-underline " +
  "transition-[background,box-shadow] duration-200 hover:bg-white/15 active:bg-white/25 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-1";
const iconTile = "flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-white text-[#2453E6]";
const actTitle = "text-xs font-semibold leading-tight";
const actSub = "text-[9.5px] leading-[1.25] opacity-85";

// Cobalt action dock — Top Up, Withdraw, Follow Channel, Refer & Earn.
export function ActionCards({ referralLink, onWithdraw }) {
  const { toast } = useToast();

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Referral link copied", description: "Share it with friends to earn rewards." });
  }

  return (
    <nav className="pc-rise-3 grid grid-cols-4 rounded-[20px] bg-[#2453E6] px-1 py-2.5 shadow-[0_14px_28px_-14px_rgba(36,83,230,0.7)]">
      <Link to="/deposit" className={actClass}>
        <span className={iconTile}><Coins className="h-5 w-5" /></span>
        <span className={actTitle}>Top Up</span>
        <span className={actSub}>USDT, TON &amp; more</span>
      </Link>
      <button type="button" onClick={onWithdraw} className={actClass}>
        <span className={iconTile}><Wallet className="h-5 w-5" /></span>
        <span className={actTitle}>Withdraw</span>
        <span className={actSub}>BEP20 · Polygon · TON</span>
      </button>
      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={actClass}>
        <span className={iconTile}><Send className="h-5 w-5" /></span>
        <span className={actTitle}>Follow Channel</span>
        <span className={actSub}>Updates &amp; offers</span>
      </a>
      <button type="button" onClick={copyReferral} className={actClass}>
        <span className={iconTile}><Gift className="h-5 w-5" /></span>
        <span className={actTitle}>Refer &amp; Earn</span>
        <span className={actSub}>Copy invite link</span>
      </button>
    </nav>
  );
}

// Slim vertical Orders / Sales rail.
export function StatsCard({ data }) {
  const tiles = [
    { label: "Orders", value: data?.orders?.length ?? 0 },
    { label: "Sales", value: data?.account_sales?.length ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-2xl border border-[#E6E1D6] bg-white px-2.5 py-3 shadow-[0_8px_20px_-14px_rgba(24,35,60,0.3)]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5C6781]">{t.label}</p>
          <p className="mt-0.5 text-[26px] font-semibold tracking-[-0.03em] text-[#2453E6]">{t.value}</p>
        </div>
      ))}
    </div>
  );
}