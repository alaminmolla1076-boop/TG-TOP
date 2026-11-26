import React from "react";

// Capsule List — shared section heading: small lavender icon, title, badge.
export default function SectionHead({ icon, title, badge }) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
      <span className="flex h-4 w-4 items-center justify-center text-[#6FA8FF]">{icon}</span>
      {title}
      {badge !== undefined && (
        <span className="rounded-full border border-[#6FA8FF]/30 bg-[rgba(108,92,231,.12)] px-[9px] py-0.5 text-[11px] font-semibold text-[#6FA8FF]">
          {badge}
        </span>
      )}
    </div>
  );
}