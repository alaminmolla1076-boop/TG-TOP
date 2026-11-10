import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, Star, ShoppingCart } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market — one seller card: avatar, handle, real sale + stock counts and a
// View Profile action that opens the seller's own country-stock page.
export default function SellerCard({ seller }) {
  const { t } = useAppLang();
  const stock = (seller.countries || []).reduce((n, c) => n + (c.stock || 0), 0);

  return (
    <div className="flex flex-col items-center gap-2 rounded-[22px] border border-[#A29BFE]/30 bg-[linear-gradient(160deg,rgba(60,48,110,.75),rgba(31,26,52,.85))] px-3 pb-3 pt-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.07)]">
      <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(140deg,#A29BFE,#6C5CE7)] p-[2px] shadow-[0_0_0_1px_rgba(162,155,254,.45),0_8px_20px_-8px_rgba(108,92,231,.9)]">
        {seller.photo_url ? (
          <img src={seller.photo_url} alt={seller.name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#1B1530] text-[17px] font-bold text-[#A29BFE]">
            {(seller.name || "S")[0].toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 w-full">
        <p className="flex items-center justify-center gap-1 text-[13px] font-semibold text-white">
          <span className="truncate">{seller.name}</span>
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#4DA3FF]" strokeWidth={2.2} />
        </p>
        {seller.username ? (
          <p className="mt-0.5 truncate text-[10.5px] text-[#a8a3cf]">@{seller.username}</p>
        ) : seller.is_self ? (
          <p className="mt-0.5 inline-flex items-center rounded-full bg-[rgba(108,92,231,.25)] px-1.5 py-px text-[9.5px] font-semibold text-[#A29BFE]">
            {t("c.you")}
          </p>
        ) : null}
      </div>

      <div className="flex w-full items-center justify-center gap-3 text-[10.5px] text-[#a8a3cf]">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3 text-[#F5C451]" strokeWidth={2} />
          <span className="tabular-nums text-[#e6e2ff]">{seller.sold ?? 0}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ShoppingCart className="h-3 w-3 text-[#A29BFE]" strokeWidth={2} />
          <span className="tabular-nums text-[#e6e2ff]">{stock}</span>
        </span>
      </div>

      <Link
        to={`/market/seller/${seller.id}`}
        className="mt-0.5 flex w-full items-center justify-center gap-1 rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.24)] px-2 py-1.5 text-[11px] font-semibold text-[#C9C4FF] no-underline transition-[background-color,border-color] duration-200 hover:border-[#A29BFE]/70 hover:bg-[rgba(108,92,231,.42)] active:opacity-85"
      >
        {t("mk.viewProfile")}
        <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2.2} />
      </Link>
    </div>
  );
}
