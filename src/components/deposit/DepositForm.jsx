import React, { useEffect, useRef, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Check, Copy, Timer, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";

const NETWORKS = ["TRC20", "ERC20", "BEP20"];

export default function DepositForm({ onApproved }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [network, setNetwork] = useState("TRC20");
  const [amount, setAmount] = useState("");
  const [request, setRequest] = useState(null);
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function stopPolling() {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }

  function reset() {
    stopPolling();
    setRequest(null);
    setStatus(null);
    setAmount("");
  }

  async function checkStatus(quiet) {
    setChecking(true);
    try {
      const res = await invoke("verifyUsdtDeposit", {
        action: "check",
        request_id: request.request_id,
      });
      setStatus(res.data.status);
      if (res.data.status === "approved") {
        toast({ title: "Deposit confirmed", description: "Your balance has been credited." });
        reset();
        onApproved && onApproved();
      } else if (res.data.status === "rejected") {
        toast({ title: "Deposit rejected", variant: "destructive" });
        reset();
        onApproved && onApproved();
      }
    } catch (err) {
      if (!quiet) {
        toast({
          title: "Could not check status",
          description: err.response?.data?.error || err.message,
          variant: "destructive",
        });
      }
    }
    setChecking(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await invoke("verifyUsdtDeposit", {
        action: "create",
        amount: Number(amount),
        network,
      });
      setRequest(res.data.request);
      setStatus("pending");
      stopPolling();
      pollRef.current = setInterval(() => checkStatus(true), 20000);
    } catch (err) {
      toast({
        title: "Could not create deposit request",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setSaving(false);
  }

  if (request) {
    return (
      <div className="grid gap-4 rounded-xl border border-border/60 bg-card p-4">
        <div className="grid gap-1.5">
          <Label>Send USDT ({request.network})</Label>
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-3">
            <Wallet className="h-4 w-4 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 break-all font-mono text-xs">{request.wallet_address}</p>
            <Button type="button" size="icon" variant="ghost" onClick={() => copy(request.wallet_address, "addr")} aria-label="Copy address">
              {copied === "addr" ? <Check className="text-primary" /> : <Copy />}
            </Button>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Exact Amount to Send</Label>
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-3">
            <p className="flex-1 font-heading text-lg font-semibold text-primary">
              {formatMoney(request.identify_amount)}
            </p>
            <Button type="button" size="icon" variant="ghost" onClick={() => copy(String(request.identify_amount), "amt")} aria-label="Copy amount">
              {copied === "amt" ? <Check className="text-primary" /> : <Copy />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Send exactly this amount — the unique cents identify your deposit and verify it automatically on-chain.
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          Request expires: {new Date(request.expires_at).toLocaleString()}
        </p>
        <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium capitalize">{status || "pending"}</span>
        </div>
        <Button type="button" onClick={() => checkStatus(false)} disabled={checking}>
          {checking ? "Checking…" : "Check Status"}
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Cancel Request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-border/60 bg-card p-4">
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
        <p className="text-[11px] text-muted-foreground">
          Deposits are verified automatically on-chain — no TXID needed.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="d-amount">Amount ($)</Label>
        <Input
          id="d-amount"
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <p className="text-[11px] text-muted-foreground">
          You will be asked to send a slightly different unique amount so the deposit can be matched to you.
        </p>
      </div>
      <Button type="submit" disabled={saving || !amount}>
        {saving ? "Creating…" : "Get Deposit Address"}
      </Button>
    </form>
  );
}