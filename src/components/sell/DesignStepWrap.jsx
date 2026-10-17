import React from "react";

// Content frame for the Sell wizard steps — a frosted frost-glass card with a
// slim lavender gradient rule running down its left edge.
export default function DesignStepWrap({ children }) {
  return (
    <div className="relative mt-[22px] flex flex-col rounded-3xl border border-ring/[.22] bg-card/75 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
      <span
        aria-hidden
        className="absolute bottom-5 left-[9px] top-5 w-[2px] rounded-[2px] bg-gradient-to-b from-ring to-transparent"
      />
      {children}
    </div>
  );
}