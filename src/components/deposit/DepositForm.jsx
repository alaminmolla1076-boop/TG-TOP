import React, { useEffect, useRef, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Check, Copy, ExternalLink, Timer, Wallet, Zap } from "lucide-react";
import { formatMoney } from "@/lib/format";

const NETWORKS = [
  { value: "TRC20", label: "TRC20" },
  { value: "ERC20", label: "ERC20" },
  { value: "BEP20", label: "BEP20" },
];

// Official Keeper Wallet (formerly Tonkeeper) — supports USDT on TRON, Ethereum and BNB Chain.
const KEEPER_URL = "https://wallet.tonkeeper.com/";

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
        toast({ title: "Top-up confirmed", description: "Your balance has been credited." });
        reset();
        onApproved && onApproved();
      } else if (res.data.status === "rejected") {
        toast({ title: "Top-up rejected", variant: "destructive" });
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
        title: "Could not create top-up request",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setSaving(false);
  }

  function openKeeper() {
    window.open(KEEPER_URL, "_blank");
  }

  if (request) {
    return (
      <div className="grid gap-4 rounded-2xl border border-emerald-500/25 bg-card p-4">
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3">
          <Zap className="h-4 w-4 shrink-0 text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-300">
            Send USDT ({request.network})
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label>Top-Up Address</Label>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <Wallet className="h-4 w-4 shrink-0 text-emerald-400" />
            <p className="min-w-0 flex-1 break-all font-mono text-xs">{request.wallet_address}</p>
            <Button type="button" size="icon" variant="ghost" onClick={() => copy(request.wallet_address, "addr")} aria-label="Copy address">
              {copied === "addr" ? <Check className="text-emerald-400" /> : <Copy />}
            </Button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>Exact Amount to Send</Label>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="flex-1 font-heading text-lg font-bold text-emerald-300">
              {formatMoney(request.identify_amount)}
            </p>
            <Button type="button" size="icon" variant="ghost" onClick={() => copy(String(request.identify_amount), "amt")} aria-label="Copy amount">
              {copied === "amt" ? <Check className="text-emerald-400" /> : <Copy />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Send exactly this amount — the unique cents identify your top-up and verify it automatically on-chain.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Pay with Keeper Wallet
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Open Keeper, paste the address above and send the exact amount — your top-up is credited automatically.
          </p>
          <Button
            type="button"
            onClick={openKeeper}
            className="mt-3 w-full rounded-full bg-white font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Connect Keeper Wallet
          </Button>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          Request expires: {new Date(request.expires_at).toLocaleString()}
        </p>
        <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium capitalize">{status || "pending"}</span>
        </div>
        <Button
          type="button"
          onClick={() => checkStatus(false)}
          disabled={checking}
          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600"
        >
          {checking ? "Checking…" : "Check Status"}
        </Button>
        <Button type="button" variant="outline" onClick={reset} className="rounded-full">
          Cancel Request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-border/50 bg-card p-4">
      <div className="grid gap-1.5">
        <Label>Network</Label>
        <div className="grid grid-cols-3 gap-2">
          {NETWORKS.map((n) => (
            <button
              key={n.value}
              type="button"
              onClick={() => setNetwork(n.value)}
              className={`rounded-2xl border p-3 text-center transition-colors ${
                network === n.value
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : "border-border/50 bg-card hover:bg-accent"
              }`}
            >
              <span className={`block text-[10px] font-semibold uppercase tracking-widest ${network === n.value ? "text-emerald-300" : "text-muted-foreground"}`}>
                USDT
              </span>
              <span className={`mt-0.5 block text-xs font-bold ${network === n.value ? "text-emerald-300" : ""}`}>
                {n.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Top-ups are verified automatically on-chain — no TXID needed.
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
          You will be asked to send a slightly different unique amount so the top-up can be matched to you.
        </p>
      </div>
      <Button
        type="submit"
        disabled={saving || !amount}
        className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600"
      >
        {saving ? "Creating…" : "Get Top-Up Address"}
      </Button>
    </form>
  );
}