import React from "react";
import { ExternalLink } from "lucide-react";
import { LOGOS, KEEPER_URL } from "@/components/deposit/logos";

export default function KeeperWalletOption({ disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => window.open(KEEPER_URL, "_blank", "noopener,noreferrer")}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left disabled:opacity-60"
    >
      <img src={LOGOS.keeper} alt="Keeper Wallet" className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Connect Keeper Wallet</p>
        <p className="mt-1 text-xs text-muted-foreground">Opens Keeper Wallet. In-app wallet connection is not configured yet.</p>
      </div>
      <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}