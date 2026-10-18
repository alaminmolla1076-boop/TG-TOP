import React from "react";
import { Crown, ShieldCheck, Users, Handshake } from "lucide-react";

// Exact-palette splash assets generated from the user's reference artwork.
const SPLASH_BG = "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/cabdbc2a2_generated_image.png";
const SPLASH_LOGO = "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/d655c1d56_generated_image.png";

// Floating gold coins: [left%, top%, size-class, float-delay, spin-duration]
const COINS = [
  { pos: "left-[7%] top-[16%]", size: "sp-coin-lg", delay: "0s", spin: "9s" },
  { pos: "right-[9%] top-[13%]", size: "sp-coin-sm", delay: "1.1s", spin: "7s" },
  { pos: "left-[10%] top-[62%]", size: "sp-coin-sm", delay: "0.6s", spin: "8s" },
  { pos: "right-[7%] top-[56%]", size: "sp-coin-lg", delay: "1.6s", spin: "11s" },
  { pos: "right-[16%] top-[76%]", size: "sp-coin-sm", delay: "0.3s", spin: "7.5s" },
];

// Frosted glass tiles with purple neon glow, like the reference.
const TILES = [
  { pos: "left-[6%] top-[36%]", icon: ShieldCheck, delay: "0.8s" },
  { pos: "right-[6%] top-[32%]", icon: Users, delay: "1.4s" },
  { pos: "left-[14%] top-[80%]", icon: Handshake, delay: "0.4s" },
  { pos: "right-[13%] top-[20%]", icon: ShieldCheck, delay: "1.9s" },
];

export default function SplashScreen() {
  return (
    <div className="sp-screen fixed inset-0 z-50 overflow-hidden">
      {/* Background artwork + exact-palette color grade */}
      <img src={SPLASH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="splash-tint absolute inset-0" />

      {/* Video-like rotating light streaks curving across the scene */}
      <div className="sp-streaks">
        <div className="sp-streak" />
        <div className="sp-streak sp-streak-2" />
      </div>

      {/* Rotating neon energy ring behind the logo */}
      <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
        <div className="sp-ring" />
        <div className="sp-ring sp-ring-2" />
      </div>

      {/* Center: TGTOP logo, wordmark, progress bar */}
      <div className="relative h-full flex flex-col items-center justify-center px-8">
        <div className="splash-halo mb-6">
          <img src={SPLASH_LOGO} alt="TG TOP" className="splash-logo sp-logo-img" />
        </div>
        <p className="sp-wordmark mb-10">P2P Marketplace</p>

        <div className="sp-bar-track">
          <div className="splash-bar h-full rounded-full relative overflow-hidden">
            <div className="splash-sheen absolute inset-y-0 w-1/4" />
          </div>
        </div>
        <p className="sp-loading-label mt-3">LOADING</p>
      </div>

      {/* Floating, spinning gold coins */}
      {COINS.map((c, i) => (
        <div key={`coin-${i}`} className={`sp-float absolute ${c.pos}`} style={{ animationDelay: c.delay }}>
          <div className={`sp-coin ${c.size}`} style={{ animationDuration: c.spin }}>
            <Crown className="sp-coin-icon" size={18} />
          </div>
        </div>
      ))}

      {/* Floating frosted glass icons */}
      {TILES.map((t, i) => (
        <div key={`tile-${i}`} className={`sp-float absolute ${t.pos}`} style={{ animationDelay: t.delay }}>
          <div className="sp-tile">
            <t.icon className="sp-tile-icon" size={20} />
          </div>
        </div>
      ))}
    </div>
  );
}