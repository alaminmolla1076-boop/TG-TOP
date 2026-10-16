import React from "react";
import { Loader2, RefreshCw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentActions({ status, checking, expiresAt, onCheck, onClose }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-xs" aria-live="polite">
        <span className="text-muted-foreground">Payment status</span>
        <span className="flex items-center gap-2 font-semibold capitalize"><span className="h-1.5 w-1.5 rounded-full bg-topup" />{status === "pending" ? "Awaiting payment" : status}</span>
      </div>
      {expiresAt && <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><Timer className="h-3.5 w-3.5" />Expires {new Date(expiresAt).toLocaleString()}</p>}
      <Button type="button" onClick={onCheck} disabled={checking || status === "approved" || status === "rejected"} className="h-12 rounded-xl bg-topup text-topup-foreground hover:bg-topup/90">
        {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />}{checking ? "Checking payment…" : "Check payment status"}
      </Button>
      <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">Close</Button>
    </div>
  );
}