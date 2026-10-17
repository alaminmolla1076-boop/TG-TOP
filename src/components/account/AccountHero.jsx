import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Plus, ArrowUpRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useCountUp } from "@/components/account/useCountUp";
import { formatMoney } from "@/lib/format";

// Midnight Platinum — unified identity + balance membership card.
export default function AccountHero({ identity, data, onWithdraw }) {
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");

  const avatarClass =
    "h-14 w-14 shrink-0 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-card";

  return (
    <section className="og-rise relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-obsidian to-card p-5 shadow-lg">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="vg-sweep absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-3.5">
          {identity?.photo_url ? (
            <Image
              src={identity.photo_url}
              alt={name}
              originWidth={160}
              originHeight={160}
              className={`${avatarClass} bg-secondary object-cover`}
            />
          ) : (
            <div
              className={`${avatarClass} flex items-center justify-center bg-secondary font-display text-2xl font-bold text-primary`}
            >
              {(name || "T")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-display text-base font-bold text-foreground">
              <span className="truncate">{name}</span>
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
            </p>
            <span className="mt-1.5 inline-block rounded-full border border-border/60 px-[9px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              ID {identity?.telegram_id || "…"}
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-border/40 pt-5">
          <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            USDT Balance
          </span>
          <p className="ca-glow mt-1.5 font-display text-5xl font-bold leading-none text-primary">
            {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Available for trading &amp; withdrawals
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <Link
              to="/deposit"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-widest no-underline text-primary-foreground transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Plus className="h-4 w-4" strokeWidth={2} /> Top Up
            </Link>
            <button
              type="button"
              onClick={onWithdraw}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold uppercase tracking-widest text-foreground transition-colors duration-200 hover:border-primary/50 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} /> Withdraw
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}