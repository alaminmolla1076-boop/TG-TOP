import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, ShoppingCart, Package } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market — one compact luxury seller card used everywhere on the market: the
// top seller and the top account holder are the same card with a gold or blue
// badge, so every card shares one design and one height.
const TONES = {
  gold: {
    card: "border-[#F5C451]/35 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_34px_-26px_rgba(245,196,81,.85)]",
    pill: "border-[#F5C451]/45 bg-[rgba(245,196,81,.14)] text-[#F5C451]",
    glow: "bg-[radial-gradient(circle,rgba(245,196,81,.22),transparent_70%)]",
  },
  blue: {
    card: "border-[#6FA8FF]/35 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_34px_-26px_rgba(45,111,253,.85)]",
    pill: "border-[#6FA8FF]/45 bg-[rgba(45,111,253,.16)] text-[#A8C8FF]",
    glow: "bg-[radial-gradient(circle,rgba(77,163,255,.22),transparent_70%)]",
  },
  plain: {
    card: "border-white/[.07] shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_14px_28px_-22px_rgba(0,0,0,.95)]",
    pill: "border-white/[.10] bg-white/[.04] text-[#8B93A7]",
    glow: "bg-[radial-gradient(circle,rgba(255,255,255,.06),transparent_70%)]",
  },
};

export default function SellerCard({ seller, badge = null }) {
  const { t } = useAppLang();
  const stock = (seller.countries || []).reduce((n, c) => n + (c.stock || 0), 0);
  const tone = TONES[badge?.tone] || TONES.plain;
  const label = badge?.label ?? t("mk.verified");

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-[linear-gradient(165deg,rgba(21,25,34,.94),rgba(9,11,16,.98))] px-2 pb-2 pt-2 transition-colors duration-200 hover:border-[#F5C451]/40 ${tone.card}`}>
      <span aria-hidden className={`pointer-events-none absolute -right-7 -top-9 h-16 w-16 rounded-full ${tone.glow}`} />

      <span className={`absolute right-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[7px] font-bold uppercase tracking-[.1em] ${tone.pill}`}>
        {badge?.icon}
        {label}
      </span>

      <div className="relative flex items-center gap-2 pr-6">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(140deg,#F5C451,#C9962B)] p-[1.5px] shadow-[0_0_0_1px_rgba(245,196,81,.18)]">
          {seller.photo_url ? (
            <img src={seller.photo_url} alt={seller.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0E1117] text-[12px] font-bold text-[#F5C451]">
              {(seller.name || "S")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11.5px] font-semibold leading-tight text-white">
            <span className="truncate">{seller.name}</span>
            <BadgeCheck className="h-3 w-3 shrink-0 text-[#4DA3FF]" strokeWidth={2.2} />
          </p>
          {seller.username ? (
            <p className="truncate text-[9.5px] leading-tight text-[#8B93A7]">@{seller.username}</p>
          ) : seller.is_self ? (
            <p className="mt-0.5 inline-flex items-center rounded-full bg-[rgba(245,196,81,.12)] px-1.5 text-[8.5px] font-semibold text-[#F5C451]">
              {t("c.you")}
            </p>
          ) : (
            <p className="text-[9.5px] leading-tight text-transparent">.</p>
          )}
        </div>
      </div>

      <div className="relative mt-1.5 flex items-center rounded-lg border border-white/[.06] bg-white/[.02] px-2 py-1">
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.08em] text-[#8B93A7]">
            <ShoppingCart className="h-2 w-2 shrink-0 text-[#6FA8FF]" strokeWidth={2.4} />
            {t("mk.totalSell")}
          </span>
          <span className="font-display text-[11.5px] font-bold leading-none tabular-nums text-white">
            {seller.sold ?? 0}
          </span>
        </div>
        <span className="h-4 w-px bg-white/[.08]" />
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.08em] text-[#8B93A7]">
            <Package className="h-2 w-2 shrink-0 text-[#F5C451]" strokeWidth={2.4} />
            {t("mk.stockLabel")}
          </span>
          <span className="font-display text-[11.5px] font-bold leading-none tabular-nums text-[#F5C451]">
            {stock}
          </span>
        </div>
      </div>

      <Link
        to={`/market/seller/${seller.id ?? ""}`}
        className="relative mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg border border-[#6FA8FF]/22 bg-[rgba(45,111,253,.10)] px-2 py-1 text-[9.5px] font-semibold text-[#A8C8FF] no-underline transition-[background-color,border-color] duration-200 hover:border-[#6FA8FF]/45 hover:bg-[rgba(45,111,253,.20)] active:opacity-85"
      >
        {t("mk.viewProfile")}
        <ChevronRight className="h-2.5 w-2.5 shrink-0" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
