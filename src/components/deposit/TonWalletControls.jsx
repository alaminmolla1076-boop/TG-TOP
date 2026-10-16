import React, { useState } from "react";
import { CHAIN } from "@tonconnect/ui";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LOGOS } from "@/components/deposit/logos";
import getTonConnector from "@/components/deposit/tonConnector";
import useKeeperWallet from "@/components/deposit/useKeeperWallet";

export default function TonWalletControls({ request, status, onCheck }) {
  const { wallet, restoring, error, connect, disconnect } = useKeeperWallet();
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const address = wallet?.account?.address;
  const wrongNetwork = Boolean(address && wallet.account.chain !== CHAIN.MAINNET);
  const pending = status === "pending";

  async function pay() {
    if (!address || wrongNetwork || sending || submitted || !pending) return;
    setSending(true);
    try {
      await getTonConnector().sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        network: CHAIN.MAINNET,
        from: address,
        messages: [{ address: request.deposit_address, amount: String(request.nano_amount) }],
      });
      setSubmitted(true);
      toast({ title: "Transfer submitted", description: "Waiting for on-chain confirmation. Do not send again." });
      onCheck?.();
    } catch (err) {
      // A user decline in the wallet is not an error — show a calm message, not the raw SDK string.
      const cancelled = /reject|declin|cancel/i.test(String(err?.message || ""));
      toast({
        title: cancelled ? "Transfer cancelled" : "Transfer not submitted",
        description: cancelled
          ? "You declined the transfer in Keeper — nothing was sent. You can try again anytime."
          : err.message || "Confirm the transfer in Keeper to continue.",
        variant: cancelled ? "default" : "destructive",
      });
    } finally { setSending(false); }
  }

  return <div className="grid gap-3">
    {restoring ? <p className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Restoring wallet connection…</p> : <>
      {address && <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2 text-xs"><span className="truncate font-mono">{address.slice(0, 6)}…{address.slice(-6)}</span><button type="button" onClick={disconnect} disabled={sending} className="shrink-0 text-primary">Change wallet</button></div>}
      {wrongNetwork && <p role="alert" className="text-xs text-destructive">Switch Keeper to TON mainnet, then reconnect.</p>}
      <Button type="button" onClick={address ? pay : connect} disabled={sending || submitted || wrongNetwork || !pending} className="h-12 w-full rounded-full bg-chart-4 text-primary-foreground text-sm font-semibold hover:bg-chart-4/90">
        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <img src={LOGOS.keeper} alt="Keeper Wallet" className="h-6 w-6 rounded-full bg-secondary/60 p-1" />}
        {sending ? "Confirm in Keeper…" : submitted ? "Awaiting confirmation…" : address ? `Pay ${request.amount_ton} TON via Keeper` : "Connect Keeper Wallet"}
      </Button>
      <p className="text-[11px] text-muted-foreground">{address ? "Confirm the pre-filled transfer in Keeper. Network fees are paid separately." : "Approve the connection in Keeper, then confirm your deposit here."}</p>
    </>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}