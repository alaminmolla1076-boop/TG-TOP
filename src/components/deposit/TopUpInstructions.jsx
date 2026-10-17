import React from "react";
import { AlertTriangle } from "lucide-react";

export default function TopUpInstructions({ network }) {
  const steps = [
    {
      title: "Open your wallet",
      text: `Open Keeper Wallet (or any USDT wallet) and choose Send USDT on the ${network} network.`,
    },
    {
      title: "Paste the address",
      text: "Paste the top-up address above — or scan the QR code directly with your wallet app.",
    },
    {
      title: "Send the exact amount",
      text: "Send the unique amount shown above, unchanged. The extra cents identify your top-up — do not round or edit them.",
    },
    {
      title: "Wait for confirmation",
      text: "Your balance is credited automatically once the transfer is confirmed on-chain — usually within a few minutes. No TXID needed.",
    },
  ];

  return (
    <div className="grid gap-3 rounded-2xl border border-border/50 bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">How to top up</p>
      <ol className="grid gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-xs text-red-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        Sending on a different network or editing the unique amount cannot be credited. Double-check the network before sending.
      </p>
    </div>
  );
}