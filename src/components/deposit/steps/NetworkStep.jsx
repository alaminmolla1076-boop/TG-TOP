import React from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGOS } from "@/components/deposit/logos";
import KeeperWalletOption from "@/components/deposit/KeeperWalletOption";

const CHAINS = [
  { value: "TON", name: "TON", badge: "TON coin", desc: "Pay in TON · converted at the live rate" },
  { value: "TRC20", name: "Tron", badge: "USDT TRC20", desc: "USDT on the Tron network" },
  { value: "ERC20", name: "Ethereum", badge: "USDT ERC20", desc: "USDT on the Ethereum network" },
  { value: "BEP20", name: "BNB Chain", badge: "USDT BEP20", desc: "USDT on the BNB Smart Chain network" },
];

export default function NetworkStep({ amount, network, creating, onSelect, onNext, walletState, onConnect }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-xs text-muted-foreground">Top-up amount</span><span className="font-heading text-lg font-bold text-topup-soft">${amount}</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground">Select payment network</h2>
        {CHAINS.map((chain) => (
          <button key={chain.value} type="button" onClick={() => onSelect(chain.value)} disabled={creating} aria-pressed={network === chain.value}
            className={network === chain.value ? "flex w-full items-center gap-3 rounded-2xl border border-topup/70 bg-topup/10 p-3 text-left disabled:opacity-60" : "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:border-topup/40 disabled:opacity-60"}>
            <img src={LOGOS[chain.value]} alt={chain.name} className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold">{chain.name}</span><span className="rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">{chain.badge}</span></div><p className="mt-0.5 text-[11px] text-muted-foreground">{chain.desc}</p></div>
            <span className={network === chain.value ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-topup bg-topup text-topup-foreground" : "h-5 w-5 shrink-0 rounded-full border border-border"}>{network === chain.value && <Check className="h-3 w-3" />}</span>
          </button>
        ))}
      </div>
      <KeeperWalletOption disabled={creating} walletState={walletState} onConnect={onConnect} />
      <Button type="button" onClick={onNext} disabled={!network || creating} className="h-12 rounded-xl bg-topup text-base font-semibold text-topup-foreground hover:bg-topup/90">{creating ? <><Loader2 className="animate-spin" />Preparing payment…</> : <>Continue to payment <ArrowRight /></>}</Button>
    </div>
  );
}