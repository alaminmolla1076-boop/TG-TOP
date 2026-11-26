import React from "react";

// Market — a very soft neutral wash behind the top of the page. No image:
// just a faint blue/gold glow so the page reads calm and premium.
export default function MarketBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[320px] bg-[radial-gradient(120%_100%_at_50%_0%,rgba(45,111,253,.10),rgba(245,196,81,.045)_45%,transparent_78%)]"
    />
  );
}
