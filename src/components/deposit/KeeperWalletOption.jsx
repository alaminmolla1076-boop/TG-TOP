import React, { useEffect, useRef } from "react";
import { CHAIN } from "@tonconnect/ui";
import { ChevronRight, Loader2 } from "lucide-react";
import { LOGOS } from "@/components/deposit/logos";
import useKeeperWallet from "@/components/deposit/useKeeperWallet";

export default function KeeperWalletOption({ disabled, onConnected }) {
  const { wallet, restoring, error, connect, disconnect } = useKeeperWallet();
  const waiting = useRef(false);
  const mainnet = wallet?.account?.chain === CHAIN.MAINNET;

  useEffect(() => {
    if (wallet && mainnet && waiting.current) {
      waiting.current = false;
      onConnected();
    }
  }, [wallet, mainnet, onConnected]);

  async function handleConnect() {
    if (mainnet) return onConnected();
    if (wallet) await disconnect();
    waiting.current = true;
    await connect();
  }

  return (
    <div className="grid gap-2">
      <button type="button" disabled={disabled || restoring} onClick={handleConnect} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left disabled:opacity-60">
        <img src={LOGOS.keeper} alt="Keeper Wallet" className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{mainnet ? "Continue with Keeper Wallet" : "Connect Keeper Wallet"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{restoring ? "Checking wallet connection…" : "Connect securely, then confirm your TON deposit in Keeper."}</p>
        </div>
        {disabled || restoring ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
      </button>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}