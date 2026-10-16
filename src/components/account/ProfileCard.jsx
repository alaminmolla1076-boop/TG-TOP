import React from "react";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import { BadgeCheck, ShieldCheck } from "lucide-react";

// Luxury profile card — avatar with a gold ring, verified tick beside the
// name, username underneath and the Telegram ID in a gold hairline chip.
export default function ProfileCard({ identity }) {
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-card p-5 shadow-[0_0_45px_-18px_rgba(212,175,55,0.55)]"
    >
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl" />

      <div className="relative flex items-center gap-4">
        {identity?.photo_url ? (
          <Image
            src={identity.photo_url}
            alt={name}
            originWidth={160}
            originHeight={160}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400/80 ring-offset-2 ring-offset-card"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-emerald-500/20 text-2xl font-bold text-amber-300 ring-2 ring-amber-400/80 ring-offset-2 ring-offset-card">
            {(name || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-heading text-lg font-bold leading-tight text-white">{name}</p>
            <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
          </div>
          {identity?.username && (
            <p className="truncate text-sm text-muted-foreground">@{identity.username}</p>
          )}
        </div>
        {identity?.role === "admin" && (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </span>
        )}
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <span className="rounded-full border border-amber-400/25 bg-amber-400/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-amber-200/90">
          ID {identity?.telegram_id || "…"}
        </span>
      </div>
    </motion.section>
  );
}