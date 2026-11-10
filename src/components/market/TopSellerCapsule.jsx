import React from "react";
import { Trophy, BadgeCheck } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — the Top Seller card: gold-ringed avatar, the seller's
// completed-sales count and a gold trophy accent. Counts are real
// (top_ups tagged account_sale); with no sales yet it truthfully shows 0.
export default function TopSellerCapsule({ topSeller }) {
  const { t } = useAppLang();
  const sold = topSeller?.sold ?? 0;

  return (
    <div className="mk-cap relative overflow-hidden rounded-[28px] border border-[#F5C451]/35 bg-[linear-gradient(135deg,rgba(92,40,199,.55)_0%,rgba(45,38,78,.92)_48%,rgba(19,17,28,.96)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.09),0_22px_50px_-22px_rgba(92,40,199,.85)]">
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,196,81,.35),transparent_70%)]" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(108,92,231,.45),transparent_70%)]" />

      <div className="relative flex items-start gap-3.5">
        <div className="relative shrink-0">
          <div className="flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(140deg,#FFD86B,#B07C1E)] p-[2px] shadow-[0_0_0_1px_rgba(245,196,81,.5),0_10px_24px_-8px_rgba(245,196,81,.7)]">
            {topSeller?.photo_url ? (
              <img src={topSeller.photo_url} alt={topSeller?.name || "top seller"} className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[#1B1530] text-[#F5C451]">
                <Trophy className="h-6 w-6" strokeWidth={1.6} />
              </span>
            )}
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#F5C451]/50 bg-[#1B1530] px-1.5 py-px text-[7.5px] font-bold uppercase tracking-[.1em] text-[#F5C451]">
            {t("mk.topSeller")}
          </span>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="flex items-center gap-1.5 text-[14.5px] font-semibold leading-tight text-white">
            <span className="truncate">{topSeller?.name || t("mk.topSeller")}</span>
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#4DA3FF]" strokeWidth={2.2} />
          </p>
          {topSeller?.username && (
            <p className="mt-0.5 truncate text-[11.5px] text-[#c3bce6]">@{topSeller.username}</p>
          )}
          <div className="mt-2.5 flex items-end gap-2">
            <span className="bg-[linear-gradient(120deg,#FFE9A8,#F5C451,#D79A2B)] bg-clip-text font-display text-[30px] font-bold leading-none text-transparent tabular-nums">
              {sold}
            </span>
            <span className="pb-0.5 text-[10px] font-semibold uppercase tracking-[.1em] text-[#c3bce6]">
              {t("mk.totalSales")}
            </span>
          </div>
        </div>

        <Trophy
          aria-hidden
          className="h-14 w-14 shrink-0 text-[#F5C451] drop-shadow-[0_8px_18px_rgba(245,196,81,.55)]"
          strokeWidth={1.2}
        />
      </div>
    </div>
  );
}
