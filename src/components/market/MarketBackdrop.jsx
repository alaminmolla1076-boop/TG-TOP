import React from "react";

const BACKDROP_URL =
  "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/53007f17e_generated_64743059.jpg";

// Capsule List — faint Account-style hero wash behind the market pages.
export default function MarketBackdrop() {
  return (
    <>
      <img
        aria-hidden
        src={BACKDROP_URL}
        alt=""
        className="fixed inset-x-0 top-0 z-0 h-[520px] w-full object-cover opacity-30"
      />
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-0 h-[520px] bg-gradient-to-b from-[rgba(19,17,28,.2)] to-[#13111C]"
      />
    </>
  );
}