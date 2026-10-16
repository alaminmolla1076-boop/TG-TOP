import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Coins, Wallet, Send, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCountUp } from "@/components/account/useCountUp";
import { formatMoney } from "@/lib/format";

const CHANNEL_URL = "https://t.me/tgtops";

// Separate luxury balance card — engraved gold label above a count-up balance.
export function BalanceCard({ data }) {
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-card to-[hsl(var(--card))]/40 p-5 shadow-[0_0_45px_-18px_rgba(212,175,55,0.45)]"
    >
      <div className="pointer-events-none absolute -left-16 -bottom-20 h-44 w-44 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

      <p className="relative text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/80">
        USDT Balance
      </p>
      <p className="relative mt-1.5 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text font-heading text-4xl font-extrabold tracking-tight text-transparent drop-shadow-sm">
        {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
      </p>
      <div className="relative mt-3 h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
    </motion.section>
  );
}

// Orders / Sales — a dedicated two-tile stats card.
export function StatsCard({ data }) {
  const orders = data?.orders?.length ?? 0;
  const sales = data?.account_sales?.length ?? 0;

  const tiles = [
    { label: "Orders", value: orders },
    { label: "Sales", value: sales },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12, ease: "easeOut" }}
      className="grid grid-cols-2 gap-3"
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-3xl border border-amber-400/20 bg-card p-4 shadow-[0_0_35px_-18px_rgba(212,175,55,0.4)]"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            {t.label}
          </p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-amber-300">{t.value}</p>
        </div>
      ))}
    </motion.section>
  );
}

// 2×2 jewel grid of separate action cards: Top Up, Withdraw, Follow Channel, Refer.
export function ActionCards({ referralLink, onWithdraw }) {
  const { toast } = useToast();

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Referral link copied", description: "Share it with friends to earn rewards." });
  }

  const tileClass = "group flex flex-col items-start gap-2.5 rounded-3xl border p-4 text-left transition-transform active:scale-[0.97]";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
      className="grid grid-cols-2 gap-3"
    >
      <Link to="/deposit" className={`${tileClass} border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 hover:border-emerald-400/60`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30">
          <Coins className="h-5 w-5" />
        </span>
        <p className="font-heading text-sm font-bold text-white">Top Up</p>
        <p className="text-[11px] text-muted-foreground">USDT, TON & more</p>
      </Link>

      <button type="button" onClick={onWithdraw} className={`${tileClass} border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 hover:border-emerald-400/60`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30">
          <Wallet className="h-5 w-5" />
        </span>
        <p className="font-heading text-sm font-bold text-white">Withdraw</p>
        <p className="text-[11px] text-muted-foreground">BEP20 · Polygon · TON</p>
      </button>

      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={`${tileClass} border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-yellow-600/10 hover:border-amber-400/60`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-md shadow-amber-400/30">
          <Send className="h-5 w-5" />
        </span>
        <p className="font-heading text-sm font-bold text-white">Follow Channel</p>
        <p className="text-[11px] text-muted-foreground">Updates & offers</p>
      </a>

      <button type="button" onClick={copyReferral} className={`${tileClass} border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-yellow-600/10 hover:border-amber-400/60`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-md shadow-amber-400/30">
          <Gift className="h-5 w-5" />
        </span>
        <p className="font-heading text-sm font-bold text-white">Refer & Earn</p>
        <p className="text-[11px] text-muted-foreground">Copy invite link</p>
      </button>
    </motion.section>
  );
}