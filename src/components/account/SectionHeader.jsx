import React from "react";

// Vault Card — uppercase small-caps section heading with a gold wire icon.
export default function SectionHeader({ icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {icon}
      <h2 className="leading-tight">{children}</h2>
    </div>
  );
}