import React from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useCountUp } from "@/components/account/useCountUp";
import { formatMoney } from "@/lib/format";

const TOPO_URL =
  "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/40c6b9d06_generated_876cc029.jpg";

// Obsidian membership card — identity column, amber hairline rule, balance,
// with the Orders/Sales strip inside the card below a hairline divider.
export default function ProfileHeroCard({ identity, data }) {
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);

  const stats = [
    { label: "Orders", value: data?.orders?.length ?? 0 },
    { label: "Sales", value: data?.account_sales?.length ?? 0 },
  ];

  const avatarClass =
    "h-14 w-14 rounded-full border border-[#F39C12] shadow-[0_0_0_4px_#1B1F23,0_0_0_5px_rgba(243,156,18,0.4)]";

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-[#F39C12] bg-[#1B1F23] px-4 py-5">
      <img
        src={TOPO_URL}
        alt=""
        aria-hidden="true"
        className="og-topo pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative grid grid-cols-[132px_1px_1fr] gap-x-3.5">
        <div className="og-rise flex flex-col items-center gap-2 text-center">
          {identity?.photo_url ? (
            <Image
              src={identity.photo_url}
              alt={name}
              originWidth={160}
              originHeight={160}
              className={`${avatarClass} bg-[#1D2125] object-cover`}
            />
          ) : (
            <div
              className={`${avatarClass} flex items-center justify-center bg-[#1D2125] text-[22px] font-semibold text-[#F39C12]`}
            >
              {(name || "T")[0].toUpperCase()}
            </div>
          )}
          <p className="flex items-center gap-1 text-[13px] font-semibold leading-tight text-white">
            <span className="truncate">{name}</span>
            <BadgeCheck className="h-[15px] w-[15px] shrink-0 text-[#F39C12]" strokeWidth={1.6} />
          </p>
          <span className="rounded-full border border-[rgba(243,156,18,0.5)] px-[9px] py-[3px] text-[10px] font-semibold tracking-[0.16em] text-[#F39C12]">
            ID {identity?.telegram_id || "…"}
          </span>
          {identity?.role === "admin" && (
            <span className="inline-flex items-center gap-[3px] rounded-full bg-[#F39C12] px-[9px] py-[3px] text-[10px] font-bold text-[#1D2125]">
              <ShieldCheck className="h-[11px] w-[11px]" strokeWidth={2} /> Admin
            </span>
          )}
        </div>

        <div className="bg-[rgba(243,156,18,0.45)]" />

        <div className="og-rise-2 flex flex-col justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F39C12]">
            USDT Balance
          </p>
          <p className="my-1.5 text-[42px] font-light leading-[1.15] tracking-[0.01em] text-white">
            {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
          </p>
          <p className="text-[11px] leading-snug text-[#9aa3ab]">
            Available for trading &amp; withdrawals
          </p>
        </div>
      </div>

      <div className="og-rise-3 relative mt-[18px] grid grid-cols-2 gap-3 border-t border-[rgba(243,156,18,0.3)] pt-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[14px] border border-[#2a3036] bg-[#1D2125] px-3.5 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa3ab]">
              {s.label}
            </div>
            <div className="mt-0.5 text-[26px] font-light text-[#F39C12]">{s.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}