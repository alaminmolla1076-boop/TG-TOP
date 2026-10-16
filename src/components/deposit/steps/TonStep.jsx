import React, { useState } from "react";
import { Check, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getTonConnector } from "@/components/deposit/useTonWallet";

export default function TonStep({ request, status, onCheck }) {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  async function pay() {
    setSending(true);
    try {
      await getTonConnector().sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: request.deposit_address, amount: String(request.nano_amount) }],
      });
      setSubmitted(true);
      toast({ title: "Transfer submitted", description: "Waiting for on-chain confirmation." });
      onCheck?.();
    } catch (err) {
      toast({ title: "Transfer not submitted", description: err.message || "The transfer was not confirmed in Keeper.", variant: "destructive" });
    } finally { setSending(false); }
  }
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="text-center text-[11px] text-muted-foreground">Or pay directly with your connected Keeper wallet</p>
      <Button type="button" onClick={pay} disabled={sending || submitted || status !== "pending"} className="h-12 w-full rounded-xl bg-topup text-topup-foreground hover:bg-topup/90">
        {sending ? <Loader2 className="animate-spin" /> : submitted ? <Check /> : <Wallet />}
        {sending ? "Confirm in Keeper…" : submitted ? "Transfer submitted" : `Pay ${request.amount_ton} TON with Keeper`}
      </Button>
    </div>
  );
}