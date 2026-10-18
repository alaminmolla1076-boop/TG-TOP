import React from "react";
import { LOGO_URL } from "@/lib/brand";

export default function SplashScreen() {
  return (
    <div className="splash-screen fixed inset-0 z-50 flex items-center justify-center overflow-hidden" role="status" aria-label="Loading TG TOP">
      <div className="relative flex flex-col items-center">
        <img src={LOGO_URL} alt="TG TOP" className="splash-logo h-32 w-32 object-contain" />
        <div className="mt-8 h-[3px] w-44 overflow-hidden rounded-full bg-primary/10" aria-hidden="true">
          <div className="splash-bar h-full rounded-full" />
        </div>
        <p className="mt-5 text-[9px] font-medium uppercase tracking-[0.4em] text-muted-foreground">LOADING</p>
      </div>
    </div>
  );
}