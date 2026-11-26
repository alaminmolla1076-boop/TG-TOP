import React from "react";
import { Gem, BadgeCheck, Package } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — the compact Top Account Holder card: the seller holding the
// largest stock of accounts on the market right now.
export default function TopHolderCapsule({ holder }) {
  const { t } = useAppLang();
  const stock = holder?.stock ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#4DA3FF]/35 bg-[linear-gradient(135deg,rgba(45,111,253,.4)_0%,rgba(24,32,56,.92)_52%,rgba(19,17,28,.96)_100%)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_16px_34px_-24px_rgba(45,111,253,.9)]">
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(77,163,255,.3),transparent_70%)]" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#4DA3FF]/45 bg-[#101a2c]/80 px-1.5 py-px text-[7.5px] font-bold uppercase tracking-[.1em] text-[#A8C8FF]">
          <Gem className="h-2 w-2" strokeWidth={2.6} />
          {t("mk.topHolder")}
        </span>
        <Package aria-hidden className="h-3.5 w-3.5 text-[#4DA3FF]/80" strokeWidth={1.6} />
      </div>

      <div className="relative mt-1.5 flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(140deg,#6FA8FF,#2D6FFD)] p-[1.5px] shadow-[0_0_0_1px_rgba(77,163,255,.45),0_8px_18px_-10px_rgba(45,111,253,.8)]">
          {holder?.photo_url ? (
            <img src={holder.photo_url} alt={holder?.name || "top account holder"} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#101a2c] text-[#A8C8FF]">
              <Gem className="h-4 w-4" strokeWidth={1.6} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11.5px] font-semibold leading-tight text-white">
            <span className="truncate">{holder?.name || t("mk.topHolder")}</span>
            <BadgeCheck className="h-3 w-3 shrink-0 text-[#4DA3FF]" strokeWidth={2.2} />
          </p>
          {holder?.username && (
            <p className="truncate text-[9.5px] leading-tight text-[#9DB4D8]">@{holder.username}</p>
          )}
        </div>
      </div>

      <div className="relative mt-1.5 flex items-baseline gap-1.5">
        <span className="bg-[linear-gradient(120deg,#DCEBFF,#8CBBFF,#3B7DFF)] bg-clip-text font-display text-[19px] font-bold leading-none text-transparent tabular-nums">
          {stock}
        </span>
        <span className="truncate text-[8px] font-semibold uppercase tracking-[.1em] text-[#9DB4D8]">
          {t("mk.totalStock")}
        </span>
      </div>
    </div>
  );
}
