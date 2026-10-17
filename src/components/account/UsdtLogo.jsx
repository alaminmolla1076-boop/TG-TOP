import React from "react";

// Official Tether (USDT) mark as an inline SVG — no CDN dependency, always renders.
export default function UsdtLogo({ className = "h-14 w-14" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="USDT">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        fill="#ffffff"
        d="M17.74 17.57v-1.96h4.51v-2.98H9.75v2.98h4.51v1.96c-3.67.17-6.43.9-6.43 1.77 0 .87 2.76 1.6 6.43 1.77v6.31h2.98v-6.31c3.66-.17 6.42-.9 6.42-1.77 0-.87-2.76-1.6-6.42-1.77zm0 3c-.09.02-.55.05-1.17.05h-.01c-.62 0-1.08-.03-1.17-.05-2.95-.13-5.15-.64-5.15-1.26 0-.61 2.2-1.13 5.15-1.26v2.27c.09.01.55.04 1.18.04.63 0 1.08-.03 1.17-.04v-2.27c2.94.13 5.14.65 5.14 1.26 0 .62-2.2 1.13-5.14 1.26zM23.32 9v2.81H8.68V9z"
      />
    </svg>
  );
}