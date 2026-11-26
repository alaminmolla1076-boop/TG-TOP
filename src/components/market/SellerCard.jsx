import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, ShoppingCart, Package } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market — one premium card design for every seller. The top seller and the
// top account holder use the same card with a gold or blue frame and a #1
// badge; every other seller keeps the same card in its slim blue variant.
const TONES = {
  gold: {
    card: "border-[#F5C451]/60 bg-[linear-gradient(165deg,#17130a,#08090c)] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_30px_-24px_rgba(245,196,81,.9)]",
    rank: "bg-[linear-gradient(135deg,#FFE29A,#F5C451)] text-[#241505]",
    stat: "text-[#F5C451]",
    glow: "bg-[radial-gradient(circle,rgba(245,196,81,.18),transparent_70%)]",
  },
  blue: {
    card: "border-[#4D8BFF]/55 bg-[linear-gradient(165deg,#0d1626,#08090c)] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_30px_-24px_rgba(77,139,255,.9)]",
    rank: "bg-[linear-gradient(135deg,#9CC6FF,#4D8BFF)] text-[#04101f]",
    stat: "text-[#8FC0FF]",
    glow: "bg-[radial-gradient(circle,rgba(77,139,255,.2),transparent_70%)]",
  },
  plain: {
    card: "border-[#4D8BFF]/25 bg-[linear-gradient(165deg,#0c1119,#07080b)] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]",
    rank: "bg-white/10 text-white",
    stat: "text-[#6FA8FF]",
    glow: "bg-[radial-gradient(circle,rgba(77,139,255,.12),transparent_70%)]",
  },
};

function CardAvatar({ seller, size, rank, rankClass }) {
  return (
    <div className="relative shrink-0">
      <div className={size + " overflow-hidden rounded-full bg-[#101319] ring-1 ring-white/[.12]"}>
        {seller.photo_url ? (
          <img src={seller.photo_url} alt={seller.name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[15px] font-bold text-[#F5C451]">
            {(seller.name || "S")[0].toUpperCase()}
          </span>
        )}
      </div>
      {rank ? (
        <span className={"absolute -bottom-1 -left-1 rounded-full px-1.5 py-[1px] text-[8.5px] font-extrabold leading-none " + rankClass}>
          {"#" + rank}
        </span>
      ) : null}
    </div>
  );
}

export default function SellerCard({ seller, tone: toneKey = "plain", rank = null, stat = null }) {
  const { t } = useAppLang();
  const person = seller || {};
  const tone = TONES[toneKey] || TONES.plain;
  const stock = (person.countries || []).reduce((n, c) => n + (c.stock || 0), 0);
  const profileTo = "/market/seller/" + (person.id || "");

  if (stat) {
    return (
      <div className={"relative overflow-hidden rounded-[20px] border p-3 " + tone.card}>
        <span aria-hidden className={"pointer-events-none absolute -right-8 -top-10 h-20 w-20 rounded-full " + tone.glow} />
        <div className="relative mb-1 flex justify-end">
          <a
            href="#mk-sellers"
            className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#8B93A7] no-underline transition-colors duration-200 hover:text-white"
          >
            See All
            <ChevronRight className="h-2.5 w-2.5 shrink-0" strokeWidth={2.6} />
          </a>
        </div>

        <Link to={profileTo} className="relative flex items-center gap-2.5 no-underline">
          <CardAvatar seller={person} size="h-11 w-11" rank={rank} rankClass={tone.rank} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[12.5px] font-bold leading-tight text-white">
              <span className="truncate">{person.name}</span>
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#4DA3FF]" strokeWidth={2.4} />
            </p>
            {person.username ? (
              <p className="truncate text-[10px] leading-tight text-[#8B93A7]">{"@" + person.username}</p>
            ) : null}
          </div>
        </Link>

        <div className="relative mt-2.5 flex items-center gap-1.5 border-t border-white/[.06] pt-2 text-[10.5px] font-medium text-[#8B93A7]">
          <span className={tone.stat}>{stat.icon}</span>
          <span className="text-[12px] font-bold tabular-nums text-white">{stat.value}</span>
          <span className="truncate">{stat.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={"relative overflow-hidden rounded-[20px] border p-3 " + tone.card}>
      <span aria-hidden className={"pointer-events-none absolute -right-8 -top-10 h-20 w-20 rounded-full " + tone.glow} />

      <Link to={profileTo} className="relative flex items-start gap-2.5 no-underline">
        <CardAvatar seller={person} size="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[12.5px] font-bold leading-tight text-white">
            <span className="truncate">{person.name}</span>
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#4DA3FF]" strokeWidth={2.4} />
          </p>
          {person.username ? (
            <p className="truncate text-[10px] leading-tight text-[#8B93A7]">{"@" + person.username}</p>
          ) : person.is_self ? (
            <p className="mt-0.5 inline-flex items-center rounded-full bg-[rgba(245,196,81,.12)] px-1.5 text-[9px] font-semibold text-[#F5C451]">
              {t("c.you")}
            </p>
          ) : (
            <p className="text-[10.5px] leading-tight text-transparent">.</p>
          )}
        </div>
      </Link>

      <div className="relative mt-2.5 flex items-center gap-1.5">
        <span className="flex min-w-0 flex-1 items-center justify-center gap-0.5 rounded-xl border border-white/[.07] bg-white/[.03] px-1 py-1.5 text-[8px] font-semibold text-[#C7CEDD]">
          <ShoppingCart className="h-3 w-3 shrink-0 text-[#6FA8FF]" strokeWidth={2.2} />
          <span className="font-bold tabular-nums text-white">{person.sold || 0}</span>
          <span className="whitespace-nowrap">{t("mk.totalSell")}</span>
        </span>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-0.5 rounded-xl border border-white/[.07] bg-white/[.03] px-1 py-1.5 text-[8px] font-semibold text-[#C7CEDD]">
          <Package className="h-3 w-3 shrink-0 text-[#F5C451]" strokeWidth={2.2} />
          <span className="font-bold tabular-nums text-white">{stock}</span>
          <span className="whitespace-nowrap">{t("mk.stockLabel")}</span>
        </span>
      </div>

      <Link
        to={profileTo}
        className="relative mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-[#6FA8FF]/30 bg-[rgba(45,111,253,.10)] px-2 py-2 text-[11px] font-semibold text-[#A8C8FF] no-underline transition-[background-color,border-color] duration-200 hover:border-[#6FA8FF]/55 hover:bg-[rgba(45,111,253,.20)] active:opacity-85"
      >
        {t("mk.viewProfile")}
        <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2.6} />
      </Link>
    </div>
  );
}
