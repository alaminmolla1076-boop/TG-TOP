import React from "react";
import { DESIGN_VARIANTS } from "./designVariants";

// Temporary chip switcher so the builder can flip through the premium Sell
// page designs live in the preview.
export default function DesignSwitcher({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DESIGN_VARIANTS.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onChange(v.key)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === v.key
              ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_-8px_hsl(var(--primary))]"
              : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}