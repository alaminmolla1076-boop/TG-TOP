import React from "react";

// Content frame for the Sell wizard pages — a frosted frost-glass card whose
// page identity shows as a huge faint outlined glyph behind the heading.
export default function DesignStepWrap({ watermark, children }) {
  return (
    <div className="relative mt-[22px] flex flex-col overflow-hidden rounded-3xl border border-ring/[.22] bg-card/75 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
      {watermark && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-7 -top-8 text-ring opacity-[.08]"
        >
          {watermark}
        </span>
      )}
      <div className="relative flex flex-col">{children}</div>
    </div>
  );
}