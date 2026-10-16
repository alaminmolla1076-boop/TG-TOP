import React from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useCountUp } from "@/components/account/useCountUp";
import { formatMoney } from "@/lib/format";

const EMB_URL =
  "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/ded8c6fa6_generated_c78be1e8.jpg";

// Porcelain membership card — identity column, hairline rule, oversized balance.
export default function ProfileHeroCard({ identity, data }) {
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);

  return (
    <section className="relative grid grid-cols-[140px_1px_1fr] overflow-hidden rounded-[22px] border border-[#E6E1D6] bg-white px-[18px] py-[22px] shadow-[0_14px_34px_-16px_rgba(36,83,230,0.35)]">
      <img
        src={EMB_URL}
        alt=""
        aria-hidden="true"
        className="pc-emb pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
      />

      <div className="pc-rise relative flex flex-col items-center gap-2 pr-3 text-center">
        {identity?.photo_url ? (
          <Image
            src={identity.photo_url}
            alt={name}
            originWidth={160}
            originHeight={160}
            className="h-14 w-14 rounded-full object-cover shadow-[0_0_0_3px_#fff,0_0_0_5px_#2453E6]"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2453E6] text-[22px] font-bold text-white shadow-[0_0_0_3px_#fff,0_0_0_5px_#2453E6]">
            {(name || "T")[0].toUpperCase()}
          </div>
        )}
        <p className="flex items-center gap-1 text-sm font-semibold leading-tight text-[#18233C]">
          <span className="truncate">{name}</span>
          <BadgeCheck className="h-[15px] w-[15px] shrink-0 text-[#2453E6]" />
        </p>
        {identity?.username && (
          <p className="text-xs leading-tight text-[#5C6781]">@{identity.username}</p>
        )}
        <span className="rounded-full bg-[#EEF2FE] px-[9px] py-[3px] text-[10px] font-semibold tracking-[0.14em] text-[#2453E6]">
          ID {identity?.telegram_id || "…"}
        </span>
        {identity?.role === "admin" && (
          <span className="flex items-center gap-[3px] rounded-full border border-[#2453E6] px-2 py-[2px] text-[10px] font-semibold text-[#2453E6]">
            <ShieldCheck className="h-[11px] w-[11px]" /> Admin
          </span>
        )}
      </div>

      <div className="relative bg-[#DDD8CC]" />

      <div className="pc-rise-2 relative flex flex-col justify-center pl-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2453E6]">USDT Balance</p>
        <p className="my-1.5 text-[44px] font-semibold leading-[1.1] tracking-[-0.04em] text-[#18233C]">
          {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
        </p>
        <p className="text-xs leading-snug text-[#5C6781]">Available for trading &amp; withdrawals</p>
      </div>
    </section>
  );
}