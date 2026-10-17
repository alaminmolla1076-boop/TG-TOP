import React from "react";

// Premium content-frame skins for the Sell wizard — one per design variant.
export default function DesignStepWrap({ variant, children }) {
  if (variant === "ribbon") {
    return (
      <div className="relative rounded-2xl border border-border/60 bg-card/80 p-5 pl-8">
        <span className="absolute left-3 top-6 bottom-6 w-[3px] rounded-full bg-primary/70 shadow-[0_0_16px_-2px_hsl(var(--primary))]" />
        {children}
      </div>
    );
  }
  if (variant === "focus") {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[0_24px_70px_-40px_hsl(var(--primary))]">
        {children}
      </div>
    );
  }
  if (variant === "vault") {
    return (
      <div className="rounded-xl border-2 border-primary/40 p-1.5">
        <div className="rounded-lg border border-border/70 bg-card p-5">{children}</div>
      </div>
    );
  }
  // concierge — open layout with a hairline above the step
  return <div className="border-t border-border/60 pt-6">{children}</div>;
}