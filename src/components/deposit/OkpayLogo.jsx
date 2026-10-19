import React from "react";

// OKPay brand mark — blue gradient disc with the white "OK" wordmark,
// drawn as SVG so it stays crisp inside the round network badge.
export default function OkpayLogo({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OKPay">
      <defs>
        <linearGradient id="okpay-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2AA9F2" />
          <stop offset="1" stopColor="#0B6FD8" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#okpay-g)" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="27"
        fontWeight="800"
        fill="#ffffff"
      >
        OK
      </text>
    </svg>
  );
}