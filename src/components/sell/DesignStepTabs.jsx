import React from "react";

// Step indicator for the Sell wizard — four frosted bars, completed ones dim
// violet, the active one a glowing lavender-iris gradient.
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
              active ? "text-ring" : done ? "text-[#C9C4FF]" : "text-muted-foreground"
            }`}
          >
            <span
              aria-hidden
              className={`mb-[7px] block h-[3px] rounded-[4px] ${
                active
                  ? "sf-bar-active bg-gradient-to-r from-primary to-ring shadow-[0_0_10px_rgba(108,92,231,.55)]"
                  : done
                  ? "bg-primary/60"
                  : "bg-secondary"
              }`}
            />
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}