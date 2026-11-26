import React from "react";
import { Trophy, BadgeCheck } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — the compact Top Seller card: gold-ringed avatar, the seller's
// completed-sales count and a gold trophy accent. Counts are real
// (top_ups tagged account_sale); with no sales yet it truthfully shows 0.
export default function TopSellerCapsule({ topSeller }) {
  const { t } = useAppLang();
  const sold = topSeller?.sold ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#F5C451]/35 bg-[linear-gradient(135deg,rgba(92,40,199,.5)_0%,rgba(45,38,78,.9)_52%,rgba(19,17,28,.96)_100%)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_16px_34px_-24px_rgba(92,40,199,.9)]">
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(245,196,81,.3),transparent_70%)]" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#F5C451]/45 bg-[#151e30]/80 px-1.5 py-px text-[7.5px] font-bold uppercase tracking-[.1em] text-[#F5C451]">
          <Trophy className="h-2 w-2" strokeWidth={2.6} />
          {t("mk.topSeller")}
        </span>
        <Trophy aria-hidden className="h-3.5 w-3.5 text-[#F5C451]/80" strokeWidth={1.6} />
      </div>

      <div className="relative mt-1.5 flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(140deg,#FFD86B,#B07C1E)] p-[1.5px] shadow-[0_0_0_1px_rgba(245,196,81,.45),0_8px_18px_-10px_rgba(245,196,81,.8)]">
          {topSeller?.photo_url ? (
            <img src={topSeller.photo_url} alt={topSeller?.name || "top seller"} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#151e30] text-[#F5C451]">
              <Trophy className="h-4 w-4" strokeWidth={1.6} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11.5px] font-semibold leading-tight text-white">
            <span className="truncate">{topSeller?.name || t("mk.topSeller")}</span>
            <BadgeCheck className="h-3 w-3 shrink-0 text-[#4DA3FF]" strokeWidth={2.2} />
          </p>
          {topSeller?.username && (
            <p className="truncate text-[9.5px] leading-tight text-[#bcc9e6]">@{topSeller.username}</p>
          )}
        </div>
      </div>

      <div className="relative mt-1.5 flex items-baseline gap-1.5">
        <span className="bg-[linear-gradient(120deg,#FFE9A8,#F5C451,#D79A2B)] bg-clip-text font-display text-[19px] font-bold leading-none text-transparent tabular-nums">
          {sold}
        </span>
        <span className="truncate text-[8px] font-semibold uppercase tracking-[.1em] text-[#bcc9e6]">
          {t("mk.totalSales")}
        </span>
      </div>
    </div>
  );
}
