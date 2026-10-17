import React from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";

// Vault Card — identity rail: avatar with gold ring, verified name, ID seal.
export default function IdentityRail({ identity }) {
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");

  const avatarClass =
    "h-14 w-14 shrink-0 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-card";

  return (
    <div className="og-rise flex items-center gap-3.5 rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 [animation-delay:100ms]">
      {identity?.photo_url ? (
        <Image
          src={identity.photo_url}
          alt={name}
          originWidth={160}
          originHeight={160}
          className={`${avatarClass} bg-secondary object-cover`}
        />
      ) : (
        <div
          className={`${avatarClass} flex items-center justify-center bg-secondary font-display text-2xl font-bold text-primary`}
        >
          {(name || "T")[0].toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-display text-base font-bold text-foreground">
          <span className="truncate">{name}</span>
          <BadgeCheck className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
        </p>
        <span className="mt-1.5 inline-block rounded-full border border-border/60 px-[9px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          ID {identity?.telegram_id || "…"}
        </span>
        {identity?.role === "admin" && (
          <span className="ml-1.5 mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            <ShieldCheck className="h-3 w-3" strokeWidth={2} /> Admin
          </span>
        )}
      </div>
    </div>
  );
}