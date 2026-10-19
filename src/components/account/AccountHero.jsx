import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Plus, ArrowUpRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useCountUp } from "@/components/account/useCountUp";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";

// Nordic Frost Glass — floating identity capsule + frosted balance pod.
export default function AccountHero({ identity, data, onWithdraw }) {
  const { t } = useAppLang();
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : t("a.telegramUser"));

  const avatarBase =
    "h-[52px] w-[52px] shrink-0 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] " +
    "shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_4px_#6C5CE7]";

  return (
    <>
      <section className="og-rise flex items-center gap-3 rounded-full border border-ring/25 bg-card/70 py-2.5 pl-2.5 pr-4 shadow-[0_8px_24px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.08)] [animation-delay:.1s]">
        {identity?.photo_url ? (
          <Image
            src={identity.photo_url}
            alt={name}
            originWidth={160}
            originHeight={160}
            className={`${avatarBase} object-cover`}
          />
        ) : (
          <div className={`${avatarBase} flex items-center justify-center font-display text-2xl font-bold text-background`}>
            {(name || "T")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[15px] font-bold leading-tight text-foreground">
            <span className="truncate">{name}</span>
            <BadgeCheck className="h-4 w-4 shrink-0 text-ring" strokeWidth={1.8} />
          </p>
          <span className="mt-[5px] inline-block rounded-full border border-ring/35 px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[.08em] text-ring">
            ID {identity?.telegram_id || "…"}
          </span>
        </div>
      </section>

      <section className="nf-pod rounded-[30px] border border-ring/30 bg-gradient-to-br from-[#2D264E]/85 to-card/90 px-5 py-[22px] outline outline-[6px] outline-primary/10">
        <div className="text-[10px] font-semibold uppercase tracking-[.08em] text-ring">
          {t("a.balance")}
        </div>
        <p className="mt-2 bg-gradient-to-r from-ring to-primary bg-clip-text font-display text-[52px] font-bold leading-none text-transparent">
          {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
        </p>
        <p className="mt-2.5 text-[11px] text-muted-foreground">
          {t("a.available")}
        </p>

        <div className="mt-[18px] grid grid-cols-2 gap-2.5">
          <Link
            to="/deposit"
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] px-3.5 py-[13px] text-[13px] font-semibold uppercase tracking-[.08em] no-underline text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-[opacity,box-shadow,background-color] duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Plus className="h-4 w-4" strokeWidth={2} /> {t("menu.topUp")}
          </Link>
          <button
            type="button"
            onClick={onWithdraw}
            className="flex items-center justify-center gap-2 rounded-full border border-ring/40 bg-ring/[.14] px-3.5 py-[13px] text-[13px] font-semibold uppercase tracking-[.08em] text-[#C9C4FF] transition-[opacity,box-shadow,background-color] duration-200 hover:bg-ring/[.24] active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} /> {t("menu.withdraw")}
          </button>
        </div>
      </section>
    </>
  );
}