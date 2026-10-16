import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCopyField({ label, value, displayValue, prominent = false }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setError("");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy. Select and copy the text above.");
    }
  }
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
        <p className={prominent ? "min-w-0 flex-1 select-text break-all font-heading text-xl font-bold text-topup-soft" : "min-w-0 flex-1 select-text break-all font-mono text-xs leading-relaxed"}>{displayValue || value}</p>
        <Button type="button" variant="ghost" size="icon" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`} className="shrink-0 text-topup-soft">
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <span className="sr-only" aria-live="polite">{copied ? "Copied" : ""}</span>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}