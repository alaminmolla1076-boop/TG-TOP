import React from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";

// Copper Atelier — narrow identity rail: avatar, verified name, ID, admin seal.
export default function IdentityRail({ identity }) {
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");

  const avatarClass =
    "h-14 w-14 shrink-0 rounded-full shadow-[0_0_0_3px_#2B1C16,0_0_0_4px_#C48B68]";

  return (
    <div className="og-rise [animation-delay:100ms] flex items-center gap-3.5 rounded-[14px] bg-[#3a271e] px-4 py-3.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)]">
      {identity?.photo_url ? (
        <Image
          src={identity.photo_url}
          alt={name}
          originWidth={160}
          originHeight={160}
          className={`${avatarClass} bg-[#75513E] object-cover`}
        />
      ) : (
        <div
          className={`${avatarClass} flex items-center justify-center bg-[#75513E] font-mono text-[22px] font-semibold text-[#F1E3D4]`}
        >
          {(name || "T")[0].toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-mono text-sm font-semibold text-[#F1E3D4]">
          <span className="truncate">{name}</span>
          <BadgeCheck className="h-[15px] w-[15px] shrink-0 text-[#C48B68]" strokeWidth={1.6} />
        </p>
        <span className="mt-1.5 inline-block rounded-full border border-[#75513E] px-[9px] py-[3px] font-mono text-[10px] font-semibold tracking-[0.16em] text-[#C48B68]">
          ID {identity?.telegram_id || "…"}
        </span>
        {identity?.role === "admin" && (
          <span className="ml-1.5 mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#C48B68] px-[9px] py-[3px] font-mono text-[10px] font-bold text-[#2B1C16]">
            <ShieldCheck className="h-[11px] w-[11px]" strokeWidth={2} /> Admin
          </span>
        )}
      </div>
    </div>
  );
}