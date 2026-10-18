import React from "react";
import { LOGO_URL } from "@/lib/brand";

// First-version splash: original background artwork, app logo in a golden
// halo, gold-gradient wordmark and the purple→cyan 3s loading bar.
const SPLASH_BG = "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/f153672b0_generated_image.png";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <img src={SPLASH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative h-full flex flex-col items-center justify-center px-8">
        <div className="splash-halo mb-6">
          <img src={LOGO_URL} alt="TG TOP" className="splash-logo w-24" />
        </div>
        <p className="splash-sub mb-10 text-lg font-bold uppercase tracking-[0.2em]">P2P Marketplace</p>
        <div className="h-1.5 w-48 rounded-full border border-white/20 bg-white/5 p-0.5 overflow-hidden">
          <div className="splash-bar h-full rounded-full relative overflow-hidden">
            <div className="splash-sheen absolute inset-y-0 w-1/4" />
          </div>
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.5em] text-white/50">LOADING</p>
      </div>
    </div>
  );
}