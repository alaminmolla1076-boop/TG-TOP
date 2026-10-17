import React from "react";

const steps = [
  { no: "01", title: "Top up your balance", desc: "Top Up USDT from the Account tab — top-ups are verified automatically on-chain." },
  { no: "02", title: "Browse the market", desc: "Pick a seller below and buy their accounts — all prices are in USDT." },
  { no: "03", title: "Buy instantly", desc: "Your balance is charged and the order is completed immediately." },
];

// Capsule List — full-bleed dark band closing the page with the process steps.
export default function HowItWorksBand() {
  return (
    <section className="mk-sec -mx-4 flex flex-col gap-3.5 border-y border-[#A29BFE]/15 bg-[rgba(10,9,17,.7)] px-4 py-[22px]">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#A29BFE]">
          Simple Process
        </div>
        <h2 className="mt-1 font-heading text-2xl font-bold">How it works</h2>
      </div>
      {steps.map((s) => (
        <div
          key={s.no}
          className="flex items-center gap-3.5 rounded-[20px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] px-4 py-3.5"
        >
          <span className="text-[30px] font-bold leading-none text-[#A29BFE] tabular-nums">{s.no}</span>
          <div>
            <h3 className="text-[15px] font-medium text-foreground">{s.title}</h3>
            <p className="mt-1 text-[13px] leading-snug text-[#a8a3cf]">{s.desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}