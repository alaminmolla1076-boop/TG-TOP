import React from "react";
import { cn } from "@/lib/utils";

// Country flags as images. Emoji flags don't render on Windows/desktop
// browsers (they fall back to letter pairs such as "BD"), so every flag is
// drawn from flagcdn.com and the emoji is only a last-resort fallback.
const BASE = "h-4 w-6 shrink-0 rounded-[3px] object-cover shadow-[0_1px_4px_rgba(0,0,0,.35)]";

export default function CountryFlag({ iso, emoji, label, className }) {
  const code = String(iso || "").trim().toLowerCase().slice(0, 2);

  if (!/^[a-z]{2}$/.test(code)) {
    return <span className={className}>{emoji || iso || ""}</span>;
  }

  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={label || code.toUpperCase()}
      loading="lazy"
      draggable={false}
      className={cn(BASE, className)}
    />
  );
}
