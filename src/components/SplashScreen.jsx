import React from "react";
import { LOGO_URL } from "@/lib/brand";

// Premium entry splash: frost-glass aura, glow-pulsing TG TOP logo and a
// luxury shimmer progress bar — shown for ~3s while the app session loads.
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-obsidian">
      <div className="splash-aura absolute inset-0" />
      <div className="relative h-full flex flex-col items-center justify-center px-8">
        <div className="splash-logo">
          <img src={LOGO_URL} alt="TG TOP" className="w-28 h-28 object-contain rounded-2xl" />
        </div>
        <div className="mt-10 w-44 og-rise-3">
          <div className="h-[3px] rounded-full bg-secondary/70 overflow-hidden">
            <div className="splash-bar relative h-full rounded-full">
              <div className="splash-sheen absolute inset-y-0 w-8" />
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground/80">
            Loading
          </p>
        </div>
      </div>
    </div>
  );
}