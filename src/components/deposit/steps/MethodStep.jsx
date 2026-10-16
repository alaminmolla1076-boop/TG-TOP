import React from "react";
import { ChevronRight, Loader2, QrCode } from "lucide-react";
import { LOGOS } from "../logos";

export default function MethodStep({ network, amount, creating, onPick }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl font-bold">Payment Method</h2>
        <p className="text-xs text-muted-foreground">
          How would you like to send <span className="font-bold text-emerald-300">${amount} USDT</span> on {network}?
        </p>
      </div>

      <button
        type="button"
        disabled={creating}
        onClick={() => onPick("keeper")}
        className="w-full rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 p-4 text-left transition-all hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.5)] disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 p-1">
            <img src={LOGOS.keeper} alt="Keeper Wallet" className="h-10 w-10 rounded-lg" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold">Connect Keeper Wallet</p>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Recommended
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Connect Keeper and send directly — the fastest way to top up.
            </p>
          </div>
          {creating ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-400" />
          ) : (
            <ChevronRight className="h-5 w-5 shrink-0 text-emerald-400" />
          )}
        </div>
      </button>

      <button
        type="button"
        disabled={creating}
        onClick={() => onPick("manual")}
        className="w-full rounded-2xl border border-border/50 bg-card p-4 text-left transition-all hover:border-emerald-500/40 disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/60">
            <QrCode className="h-6 w-6 text-emerald-300" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Other Wallet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Get our address and QR code, then send from any wallet manually.
            </p>
          </div>
          {creating ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-400" />
          ) : (
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
        </div>
      </button>
    </div>
  );
}