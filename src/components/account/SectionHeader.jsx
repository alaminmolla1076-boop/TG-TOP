import React from "react";

// Copper Atelier — uppercase monospace section heading with a copper wire icon.
export default function SectionHeader({ icon, children }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F1E3D4]">
      {icon}
      <h2 className="leading-tight">{children}</h2>
    </div>
  );
}