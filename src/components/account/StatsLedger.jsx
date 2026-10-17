import React from "react";

// Copper Atelier — compact two-column Orders / Sales ledger.
export default function StatsLedger({ orders, sales }) {
  const items = [
    { label: "Orders", value: orders },
    { label: "Sales", value: sales },
  ];

  return (
    <section className="og-rise grid grid-cols-2 rounded-[14px] bg-[#3a271e] shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] [animation-delay:400ms]">
      {items.map((s, i) => (
        <div key={s.label} className={`px-4 py-3.5 ${i > 0 ? "border-l border-[#75513E]" : ""}`}>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C48B68]">
            {s.label}
          </div>
          <div className="mt-0.5 font-mono text-[30px] font-medium text-[#F1E3D4]">{s.value}</div>
        </div>
      ))}
    </section>
  );
}