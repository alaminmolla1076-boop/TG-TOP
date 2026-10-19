import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, Smartphone, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";

export default function VaultBalanceCard({
  firstName,
  balance,
  approvedTotal,
  ordersCount,
  salesCount,
  topUpsCount,
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-obsidian to-card p-6 shadow-lg">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="vg-sweep absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        TG TOP · Private Wallet
      </p>
      <p className="mt-3 font-display text-2xl font-bold text-foreground">
        Welcome back, {firstName}
      </p>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Available Balance
          </p>
          <p className="ca-glow mt-1 font-display text-5xl font-bold leading-none text-primary">
            {formatMoney(balance)}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {formatMoney(approvedTotal)} topped up in total
          </p>
        </div>
        <Button asChild size="sm" className="mb-1 shrink-0 rounded-full px-5">
          <Link to="/deposit">
            <Plus className="mr-1.5 h-4 w-4" /> Top Up
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-border/40 border-t border-border/40 pt-4">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-3.5 w-3.5 text-primary" />
          <p className="mt-1.5 font-display text-xl font-bold leading-none">{ordersCount}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Orders</p>
        </div>
        <div className="text-center">
          <Smartphone className="mx-auto h-3.5 w-3.5 text-primary" />
          <p className="mt-1.5 font-display text-xl font-bold leading-none">{salesCount}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Sales</p>
        </div>
        <div className="text-center">
          <Wallet className="mx-auto h-3.5 w-3.5 text-primary" />
          <p className="mt-1.5 font-display text-xl font-bold leading-none">{topUpsCount}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Top-Ups</p>
        </div>
      </div>
    </section>
  );
}