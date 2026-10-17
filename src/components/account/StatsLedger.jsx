import React from "react";

// Nordic Frost Glass — twin pill bubbles with gradient numerals.
export default function StatsLedger({ orders, sales }) {
  const items = [
    { label: "Orders", value: orders },
    { label: "Sales", value: sales },
  ];

  return (
    <section className="og-rise grid grid-cols-2 gap-3 [animation-delay:.35s]">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-full border border-ring/25 bg-card/70 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_8px_20px_rgba(0,0,0,.3)]"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[.08em] text-ring">
            {s.label}
          </div>
          <div className="mt-1 bg-gradient-to-r from-ring to-primary bg-clip-text font-display text-[32px] font-bold leading-none text-transparent">
            {s.value}
          </div>
        </div>
      ))}
    </section>
  );
}