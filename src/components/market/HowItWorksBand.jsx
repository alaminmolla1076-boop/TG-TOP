import React from "react";

const steps = [
  { no: "01", title: "Top up your balance", desc: "Add USDT with OKPay, Keeper Wallet or on-chain USDT (TRC20 / ERC20 / BEP20) — every top-up is verified automatically." },
  { no: "02", title: "Buy in one tap", desc: "Pick a seller, search by name, choose a country and quantity — your balance is charged and the accounts are delivered instantly." },
  { no: "03", title: "Sell & earn", desc: "List accounts from the Sell tab — approved accounts go straight to your market stock and earn you on every sale." },
  { no: "04", title: "Withdraw anytime", desc: "Cash out your balance in USDT from the Withdraw page — minimum $1, flat $0.10 network fee per withdrawal." },
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