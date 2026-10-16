import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import { LOGOS } from "@/components/deposit/logos";
import { NETWORK_META } from "../withdrawNetworks";

export default function WithdrawAddressStep({ amount, network, address, submitting, onAddress, onSubmit }) {
  const meta = NETWORK_META[network] || NETWORK_META.BEP20;
  const trimmed = address.trim();
  const error = trimmed && !meta.validate(trimmed) ? meta.error : "";

  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl font-bold">Your {meta.label} Address</h2>
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-emerald-300">${amount}</span> will be sent to this address after admin approval.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/60 p-2">
          <img src={meta.logo} alt={meta.label} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{meta.label}</p>
          <p className="text-[11px] text-muted-foreground">{meta.hint}</p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Input
          value={address}
          onChange={(e) => onAddress(e.target.value)}
          placeholder={meta.placeholder}
          autoComplete="off"
          className="h-12 rounded-2xl border-border/50 bg-card font-mono text-sm focus-visible:ring-emerald-500/50"
        />
        {error ? (
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" /> {error}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Double-check the address — on-chain transfers cannot be reversed.
          </p>
        )}
      </div>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={submitting || !trimmed || !!error}
        className="h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] hover:from-emerald-600 hover:to-teal-600"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : `Submit Withdrawal Request`}
      </Button>
    </div>
  );
}