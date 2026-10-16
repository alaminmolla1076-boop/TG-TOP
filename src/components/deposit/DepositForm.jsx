import React, { useEffect, useRef, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import TopUpInstructions from "@/components/deposit/TopUpInstructions";
import { Check, Copy, ExternalLink, Timer, Wallet, Zap } from "lucide-react";
import { formatMoney } from "@/lib/format";

const PRESETS = [5, 10, 25, 50, 100, 250, 500, 1000];

const NETWORKS = [
  { value: "TRC20", label: "TRC20", dot: "bg-red-500" },
  { value: "ERC20", label: "ERC20", dot: "bg-blue-500" },
  { value: "BEP20", label: "BEP20", dot: "bg-amber-500" },
];

// Official Keeper Wallet (formerly Tonkeeper) — supports USDT on TRON, Ethereum and BNB Chain.
const KEEPER_URL = "https://wallet.tonkeeper.com/";
const KEEPER_LOGO = "https://keeperwallet.com/apple-touch-icon.png";

export default function DepositForm({ onApproved }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [preset, setPreset] = useState(null);
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("TRC20");
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
    setPreset(null);
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

  const qrUrl = request
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(request.wallet_address)}`
    : null;

  if (request) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 rounded-2xl border border-emerald-500/25 bg-card p-4">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-3">
            <img src={KEEPER_LOGO} alt="Keeper Wallet" className="h-10 w-10 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-300">Send USDT ({request.network})</p>
              <p className="text-[11px] text-muted-foreground">via Keeper Wallet</p>
            </div>
            <Zap className="h-4 w-4 shrink-0 text-emerald-400" />
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

          <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <span className="flex h-[188px] w-[188px] items-center justify-center rounded-2xl bg-white p-2">
              <img src={qrUrl} alt="Top-up address QR code" className="h-full w-full" />
            </span>
            <p className="text-[11px] text-muted-foreground">
              Scan this QR code with Keeper Wallet to fill the address automatically.
            </p>
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

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            Request expires: {new Date(request.expires_at).toLocaleString()}
          </p>
          <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{status || "pending"}</span>
          </div>
        </div>

        <TopUpInstructions network={request.network} />

        <Button
          type="button"
          onClick={openKeeper}
          className="rounded-full bg-white font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <img src={KEEPER_LOGO} alt="" className="mr-1 h-5 w-5 rounded" />
          <ExternalLink className="mr-2 h-4 w-4" /> Open Keeper Wallet
        </Button>
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
      <div className="grid gap-2">
        <Label>1. Choose Amount ($)</Label>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setPreset(v); setAmount(String(v)); }}
              className={`rounded-2xl border px-2 py-3 text-center transition-colors ${
                preset === v
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                  : "border-border/50 bg-card hover:bg-accent"
              }`}
            >
              <span className="block text-sm font-bold">${v}</span>
            </button>
          ))}
        </div>
        <Input
          type="number"
          min="1"
          step="0.01"
          placeholder="Custom amount ($)"
          value={amount}
          onChange={(e) => { setPreset(null); setAmount(e.target.value); }}
          className="rounded-xl"
        />
      </div>

      <div className="grid gap-2">
        <Label>2. Select Network</Label>
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
              <span className={`mx-auto mb-1 block h-2.5 w-2.5 rounded-full ${n.dot}`} />
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
          Verified automatically on-chain — no TXID needed. AVAX coming soon.
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

function Label({ children }) {
  return <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</p>;
}