import React from "react";

// Capsule List — shared section heading: small lavender icon, title, badge.
export default function SectionHead({ icon, title, badge }) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
      <span className="flex h-4 w-4 items-center justify-center text-[#A29BFE]">{icon}</span>
      {title}
      {badge !== undefined && (
        <span className="rounded-full border border-[#A29BFE]/30 bg-[rgba(108,92,231,.12)] px-[9px] py-0.5 text-[11px] font-semibold text-[#A29BFE]">
          {badge}
        </span>
      )}
    </div>
  );
}