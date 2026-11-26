import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, ShoppingCart, Package } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market — one compact seller card: avatar, handle, real sale + stock counts
// and a View Profile action that opens the seller's own country-stock page.
export default function SellerCard({ seller }) {
  const { t } = useAppLang();
  const stock = (seller.countries || []).reduce((n, c) => n + (c.stock || 0), 0);

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[.07] bg-[linear-gradient(165deg,rgba(21,25,34,.92),rgba(9,11,16,.96))] px-2.5 pb-2.5 pt-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_14px_28px_-22px_rgba(0,0,0,.95)] transition-colors duration-200 hover:border-[#F5C451]/30">
      <div className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(140deg,#F5C451,#C9962B)] p-[1.5px] shadow-[0_0_0_1px_rgba(245,196,81,.16),0_8px_18px_-10px_rgba(0,0,0,.9)]">
        {seller.photo_url ? (
          <img src={seller.photo_url} alt={seller.name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0E1117] text-[14px] font-bold text-[#F5C451]">
            {(seller.name || "S")[0].toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 w-full">
        <p className="flex items-center justify-center gap-1 text-[12px] font-semibold leading-tight text-white">
          <span className="truncate">{seller.name}</span>
          <BadgeCheck className="h-3 w-3 shrink-0 text-[#4DA3FF]" strokeWidth={2.2} />
        </p>
        {seller.username ? (
          <p className="mt-px truncate text-[10px] text-[#8B93A7]">@{seller.username}</p>
        ) : seller.is_self ? (
          <p className="mt-px inline-flex items-center rounded-full bg-[rgba(245,196,81,.12)] px-1.5 py-px text-[9px] font-semibold text-[#F5C451]">
            {t("c.you")}
          </p>
        ) : null}
      </div>

      <div className="grid w-full grid-cols-2 gap-1">
        <div className="flex flex-col items-center gap-0.5 rounded-lg border border-white/[.06] bg-white/[.02] px-1 py-1">
          <span className="flex items-center gap-1 text-[7.5px] font-semibold uppercase tracking-[.06em] text-[#8B93A7]">
            <ShoppingCart className="h-2 w-2 shrink-0 text-[#6FA8FF]" strokeWidth={2.4} />
            {t("mk.totalSell")}
          </span>
          <span className="font-display text-[12px] font-bold leading-none tabular-nums text-white">
            {seller.sold ?? 0}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-lg border border-white/[.06] bg-white/[.02] px-1 py-1">
          <span className="flex items-center gap-1 text-[7.5px] font-semibold uppercase tracking-[.06em] text-[#8B93A7]">
            <Package className="h-2 w-2 shrink-0 text-[#F5C451]" strokeWidth={2.4} />
            {t("mk.stockLabel")}
          </span>
          <span className="font-display text-[12px] font-bold leading-none tabular-nums text-[#F5C451]">
            {stock}
          </span>
        </div>
      </div>

      <Link
        to={`/market/seller/${seller.id}`}
        className="mt-0.5 flex w-full items-center justify-center gap-1 rounded-lg border border-[#6FA8FF]/22 bg-[rgba(45,111,253,.10)] px-2 py-1 text-[10px] font-semibold text-[#A8C8FF] no-underline transition-[background-color,border-color] duration-200 hover:border-[#6FA8FF]/45 hover:bg-[rgba(45,111,253,.20)] active:opacity-85"
      >
        {t("mk.viewProfile")}
        <ChevronRight className="h-2.5 w-2.5 shrink-0" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
