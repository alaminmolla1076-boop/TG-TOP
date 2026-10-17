import React from "react";

// Vault Card — engraved two-column Orders / Sales strip with hairline divider.
export default function StatsLedger({ orders, sales }) {
  const items = [
    { label: "Orders", value: orders },
    { label: "Sales", value: sales },
  ];

  return (
    <section className="og-rise grid grid-cols-2 divide-x divide-border/40 rounded-xl border border-border/50 bg-card/80 [animation-delay:400ms]">
      {items.map((s) => (
        <div key={s.label} className="px-5 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {s.label}
          </div>
          <div className="mt-1 font-display text-3xl font-bold leading-none text-primary">{s.value}</div>
        </div>
      ))}
    </section>
  );
}