import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Nordic Frost Glass dropdown — a themed replacement for the native <select>,
// which renders as a detached system overlay on phones. Frosted pill trigger,
// glass panel with radio-style rows. Closes on backdrop tap or Escape.
export default function GlassSelect({ id, value, onChange, options, disabled, placeholder, triggerClass, className }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-2xl border bg-secondary/80 px-4 text-left font-semibold",
          triggerClass || "h-[52px] text-base",
          "transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_3px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50",
          open ? "border-ring shadow-[0_0_0_3px_rgba(162,155,254,.22)]" : "border-ring/25"
        )}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ring transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-ring/25 bg-popover/95 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_14px_38px_rgba(0,0,0,.55)] backdrop-blur-xl"
          >
            {options.map((o) => {
              const on = o.value === value;
              return (
                <button
                  type="button"
                  key={o.value}
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 text-left text-[15px] font-semibold transition-colors duration-150 ${
                    on ? "bg-ring/[.14] text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  <span
                    className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border transition-colors duration-150 ${
                      on ? "border-ring bg-ring/25 text-ring" : "border-border text-transparent"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}