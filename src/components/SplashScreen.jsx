import React from "react";
import { LOGO_URL } from "@/lib/brand";

export default function SplashScreen() {
  return (
    <div className="splash-screen fixed inset-0 z-50 flex items-center justify-center overflow-hidden" role="status" aria-label="Loading TG TOP">
      <div className="relative flex flex-col items-center">
        <img src={LOGO_URL} alt="TG TOP" className="splash-logo h-28 w-28 object-contain" />
        <p className="splash-sub mt-6 text-xl font-black uppercase tracking-[0.18em]">P2P Marketplace</p>
        <div className="mt-9 h-2 w-52 rounded-full border border-white/15 bg-white/5 p-[3px]" aria-hidden="true">
          <div className="splash-bar relative h-full overflow-hidden rounded-full">
            <div className="splash-sheen absolute inset-y-0 w-1/4" />
          </div>
        </div>
        <p className="mt-5 text-[9px] font-medium uppercase tracking-[0.4em] text-muted-foreground">LOADING</p>
      </div>
    </div>
  );
}