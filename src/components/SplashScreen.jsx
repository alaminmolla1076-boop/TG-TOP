import React from "react";
import { LOGO_URL } from "@/lib/brand";

const SPLASH_BG = "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/f153672b0_generated_image.png";

// Premium luxury entry splash — matches the approved reference: golden-flare
// background with coins, glow-pulsing TG TOP logo in a golden halo ring,
// "P2P Marketplace" gold wordmark and an iridescent purple→cyan progress bar.
export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-obsidian">
      <img src={SPLASH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative h-full flex flex-col items-center justify-center px-8">
        <div className="splash-halo og-rise">
          <img src={LOGO_URL} alt="TG TOP" className="splash-logo w-32 h-32 object-contain" />
        </div>
        <p className="splash-sub og-rise-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.3em]">
          — P2P Marketplace —
        </p>
        <div className="mt-8 w-48 og-rise-3">
          <div className="h-[4px] rounded-full bg-black/50 ring-1 ring-white/10 overflow-hidden">
            <div className="splash-bar relative h-full rounded-full">
              <div className="splash-sheen absolute inset-y-0 w-8" />
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-[0.45em] text-slate-300/70">
            Loading
          </p>
        </div>
      </div>
    </div>
  );
}