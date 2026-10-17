import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import TopUpInstructions from "../TopUpInstructions";
import { Check, Copy, Timer, Zap } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { LOGOS } from "@/components/deposit/logos";

export default function SendStep({ request, status, checking, onCheck, onCancel }) {
  const [copied, setCopied] = useState(null);

  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(request.wallet_address)}`;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-primary/25 bg-card p-4">
        <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-3">
          <img src={LOGOS[request.network]} alt={request.network} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-primary">Send USDT ({request.network})</p>
            <p className="text-[11px] text-muted-foreground">manual transfer</p>
          </div>
          <Zap className="h-4 w-4 shrink-0 text-emerald-400" />
        </div>

        <div className="grid gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top-Up Address</p>
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3">
            <p className="min-w-0 flex-1 break-all font-mono text-xs">{request.wallet_address}</p>
            <Button type="button" size="icon" variant="ghost" onClick={() => copy(request.wallet_address, "addr")} aria-label="Copy address">
              {copied === "addr" ? <Check className="text-emerald-400" /> : <Copy />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
          <span className="flex h-[188px] w-[188px] items-center justify-center rounded-2xl bg-white p-2 shadow-[0_0_30px_-10px_rgba(16,185,129,0.4)]">
            <img src={qrUrl} alt="Top-up address QR code" className="h-full w-full" />
          </span>
          <p className="text-[11px] text-muted-foreground">
            Scan this QR code with your wallet to fill the address automatically.
          </p>
        </div>

        <div className="grid gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exact Amount to Send</p>
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3">
            <p className="flex-1 font-heading text-lg font-bold text-primary">
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
        onClick={onCheck}
        disabled={checking}
        className="h-12 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        {checking ? "Checking…" : "Check Status"}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
        Cancel Request
      </Button>
    </div>
  );
}