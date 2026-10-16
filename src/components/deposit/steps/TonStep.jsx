import React, { useEffect, useState } from "react";
import { TonConnectUI } from "@tonconnect/ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { LOGOS } from "@/components/deposit/logos";

// Single TonConnectUI instance for the app (real Keeper Wallet connection).
let connectorSingleton = null;
function getConnector() {
  if (!connectorSingleton) {
    connectorSingleton = new TonConnectUI({
      manifestUrl: "https://tg-tops.base44.app/tonconnect-manifest.json",
    });
  }
  return connectorSingleton;
}

export default function TonStep({ request, status, checking, onCheck, onCancel }) {
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const connector = getConnector();
    setWallet(connector.wallet);
    const unsubscribe = connector.onStatusChange((w) => setWallet(w));
    connector.restoreConnection().finally(() => setConnecting(false));
    return unsubscribe;
  }, []);

  async function connectKeeper() {
    const connector = getConnector();
    try {
      await connector.openSingleWalletModal("tonkeeper");
    } catch (e) {
      try {
        await connector.openModal();
      } catch (e2) {
        /* modal closed */
      }
    }
  }

  async function pay() {
    setSending(true);
    try {
      await getConnector().sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: request.deposit_address, amount: String(request.nano_amount) }],
      });
      toast({ title: "Transfer sent", description: "Confirming on-chain — this can take a few seconds." });
      onCheck && onCheck();
    } catch (err) {
      toast({
        title: "Transfer cancelled",
        description: "The transfer wasn't confirmed in Keeper.",
        variant: "destructive",
      });
    }
    setSending(false);
  }

  const address = wallet && wallet.account ? wallet.account.address : "";
  const connected = Boolean(address);
  const shortWallet = connected ? `${address.slice(0, 6)}…${address.slice(-6)}` : "";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-emerald-500/25 bg-card p-4">
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-3">
          <img src={LOGOS.TON} alt="TON" className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-300">Pay {request.amount_ton} TON</p>
            <p className="text-[11px] text-muted-foreground">
              via Keeper Wallet · credited ≈ {formatMoney(request.amount_usd)}
            </p>
          </div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        </div>

        {connecting ? (
          <p className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Restoring wallet connection…
          </p>
        ) : !connected ? (
          <div className="grid gap-3">
            <Button
              type="button"
              onClick={connectKeeper}
              className="h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] hover:from-emerald-600 hover:to-teal-600"
            >
              <WalletIcon className="h-5 w-5" /> Connect Keeper Wallet
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Keeper opens and connects your wallet — approve the connection there.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-secondary px-3 py-2 text-xs">
              <span className="text-muted-foreground">Connected wallet: </span>
              <span className="font-mono">{shortWallet}</span>
            </div>
            <Button
              type="button"
              onClick={pay}
              disabled={sending || status === "approved"}
              className="h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] hover:from-emerald-600 hover:to-teal-600"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Opening Keeper…
                </>
              ) : (
                `Pay ${request.amount_ton} TON via Keeper`
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Keeper opens with the transfer pre-filled — just confirm it there. No address or amount typing needed.
            </p>
          </>
        )}

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