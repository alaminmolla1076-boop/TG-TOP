import React from "react";

// Section heading with a small cobalt-tinted icon circle.
export default function SectionHeader({ icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#EEF2FE] text-[#2453E6]">
        {icon}
      </span>
      <h2 className="text-[15px] font-semibold leading-tight text-[#18233C]">{children}</h2>
    </div>
  );
}