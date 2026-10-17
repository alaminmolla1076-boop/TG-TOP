import React from "react";

// Uppercase fineline section heading with an amber wire icon.
export default function SectionHeader({ icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
      {icon}
      <h2 className="leading-tight">{children}</h2>
    </div>
  );
}