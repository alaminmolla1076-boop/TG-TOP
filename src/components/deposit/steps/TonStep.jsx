import React from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { LOGOS } from "@/components/deposit/logos";
import TonWalletControls from "@/components/deposit/TonWalletControls";

export default function TonStep({ request, status, checking, onCheck, onCancel }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-emerald-500/25 bg-card p-4">
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-3">
          <img src={LOGOS.keeper} alt="Keeper Wallet" className="h-9 w-9 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-300">Pay {request.amount_ton} TON</p>
            <p className="text-[11px] text-muted-foreground">
              via Keeper Wallet · credited ≈ {formatMoney(request.amount_usd)}
            </p>
          </div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        </div>

        <TonWalletControls request={request} status={status} onCheck={onCheck} />

        <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium capitalize">{status || "pending"}</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={onCheck}
        disabled={checking}
        className="h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] hover:from-emerald-600 hover:to-teal-600"
      >
        {checking ? "Checking…" : "Check Status"}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
        Cancel Request
      </Button>
    </div>
  );
}