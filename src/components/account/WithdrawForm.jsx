import React, { useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const NETWORKS = ["TRC20", "ERC20", "BEP20"];

export default function WithdrawForm({ onSubmitted }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [network, setNetwork] = useState("TRC20");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("requestWithdrawal", {
        amount: Number(amount),
        network,
        wallet_address: walletAddress,
      });
      toast({
        title: "Withdrawal requested",
        description: "Your request is pending review — funds are sent after approval.",
      });
      setAmount("");
      setWalletAddress("");
      onSubmitted && onSubmitted();
    } catch (err) {
      toast({
        title: "Could not request withdrawal",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-border/50 bg-card p-4">
      <div className="grid gap-1.5">
        <Label htmlFor="w-amount">Amount ($)</Label>
        <Input
          id="w-amount"
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Network</Label>
        <Select value={network} onValueChange={setNetwork}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="w-address">USDT Wallet Address ({network})</Label>
        <Input
          id="w-address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Paste your wallet address"
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Double-check the address — transfers on-chain cannot be reversed.
        </p>
      </div>
      <Button
        type="submit"
        disabled={saving || !amount || !walletAddress}
        className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600"
      >
        {saving ? "Requesting…" : "Request Withdrawal"}
      </Button>
    </form>
  );
}