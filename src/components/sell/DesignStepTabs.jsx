import React from "react";

// Step indicator for the Sell wizard: four labelled bars, the completed ones
// dim copper, the active one glowing amber.
export default function DesignStepTabs({ steps, stepIndex }) {
  return (
    <ol className="mt-[17px] grid list-none grid-cols-4 gap-[7px] p-0">
      {steps.map((s, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        return (
          <li
            key={s.key}
            className={`min-w-0 text-center text-[9px] leading-[1.2] ${
              active ? "text-primary" : done ? "text-[#D8CABB]" : "text-[#9C9186]"
            }`}
          >
            <span
              aria-hidden
              className={`mb-[7px] block h-[3px] rounded-[4px] ${
                active ? "sf-bar-active bg-primary" : done ? "bg-[#B77927]" : "bg-[#514840]"
              }`}
            />
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}