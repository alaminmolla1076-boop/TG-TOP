import React from "react";
import { Check, Loader2, Unplug, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGOS } from "@/components/deposit/logos";

export default function KeeperWalletOption({ disabled, walletState, onConnect }) {
  const { wallet, restoring, opening, error, disconnect } = walletState;
  const address = wallet?.account?.address;
  return (
    <section className="space-y-3 rounded-2xl border border-topup/25 bg-topup/5 p-4">
      <div className="flex items-center gap-3">
        <img src={wallet?.imageUrl || LOGOS.keeper} alt="Keeper Wallet" className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1"><p className="text-sm font-bold">Keeper Wallet</p><p className="mt-0.5 text-[11px] text-muted-foreground">Optional connection · TON payments</p></div>
        {address && <Check className="h-4 w-4 text-topup-soft" />}
      </div>
      {address ? (
        <div className="flex items-center gap-2 rounded-xl bg-background/60 py-1 pl-3 pr-1">
          <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold text-topup-soft">Connected for TON</p><p className="mt-0.5 font-mono text-xs">{address.slice(0, 8)}…{address.slice(-6)}</p></div>
          <Button type="button" variant="ghost" size="icon" onClick={disconnect} disabled={disabled} aria-label="Disconnect Keeper"><Unplug /></Button>
        </div>
      ) : (
        <Button type="button" variant="outline" disabled={disabled || restoring || opening} onClick={onConnect} className="h-11 w-full rounded-xl border-topup/40 text-topup-soft hover:bg-topup/10 hover:text-topup-soft">
          {restoring || opening ? <Loader2 className="animate-spin" /> : <Wallet />}{restoring ? "Restoring wallet…" : opening ? "Opening Keeper…" : "Connect Keeper Wallet"}
        </Button>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">Connect here to confirm a TON transfer in Keeper. For USDT, use the address and QR code on the next page.</p>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}