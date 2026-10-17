import React from "react";

// Nordic Frost Glass — lavender uppercase section heading.
export default function SectionHeader({ icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
      {icon}
      <h2 className="leading-[1.3]">{children}</h2>
    </div>
  );
}