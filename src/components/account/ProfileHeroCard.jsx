import React from "react";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { useCountUp } from "@/components/account/useCountUp";
import { formatMoney } from "@/lib/format";

// Obsidian Gold hero card — profile + balance engraved into one near-black
// glass card with 24k gold hairlines and a guilloché accent.
export default function ProfileHeroCard({ identity, data }) {
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[1.75rem] border border-amber-400/30 bg-obsidian p-5 shadow-[0_0_60px_-18px_rgba(212,175,55,0.6)]"
    >
      {/* guilloché engraved pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 130% -30%, transparent 0px, transparent 9px, rgba(212,175,55,0.7) 10px, transparent 11px)",
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-52 w-80 -translate-x-1/2 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      {/* profile row */}
      <div className="relative flex items-center gap-4">
        {identity?.photo_url ? (
          <Image
            src={identity.photo_url}
            alt={name}
            originWidth={160}
            originHeight={160}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-amber-400/80 ring-offset-2 ring-offset-obsidian"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/25 to-amber-600/10 text-xl font-bold text-amber-300 ring-2 ring-amber-400/80 ring-offset-2 ring-offset-obsidian">
            {(name || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-heading text-base font-bold leading-tight text-white">{name}</p>
            <BadgeCheck className="h-4 w-4 shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]" />
          </div>
          {identity?.username && (
            <p className="truncate text-xs text-muted-foreground">@{identity.username}</p>
          )}
        </div>
        {identity?.role === "admin" && (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            <ShieldCheck className="h-3 w-3" /> Admin
          </span>
        )}
      </div>

      {/* id chip */}
      <div className="relative mt-4 flex items-center gap-2">
        <span className="rounded-full border border-amber-400/25 bg-amber-400/5 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-amber-200/90">
          ID {identity?.telegram_id || "…"}
        </span>
      </div>

      {/* gold hairline divider */}
      <div className="relative my-5 h-px w-full bg-gradient-to-r from-transparent via-amber-400/45 to-transparent" />

      {/* engraved balance */}
      <div className="relative">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.35em] text-amber-300/80">
          USDT Balance
        </p>
        <p className="mt-1 text-center font-display text-[2.5rem] font-semibold leading-none tracking-tight text-transparent bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text drop-shadow-[0_2px_10px_rgba(212,175,55,0.25)]">
          {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
        </p>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Available for trading &amp; withdrawals
        </p>
      </div>
    </motion.section>
  );
}