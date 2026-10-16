import React from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";

export default function SummaryCards({ income, expense }) {
  const items = [
    { label: "Total Income", value: income, icon: TrendingUp, className: "text-green-400" },
    { label: "Total Expense", value: expense, icon: TrendingDown, className: "text-red-400" },
    { label: "Balance", value: income - expense, icon: Wallet, className: "text-primary" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon, className }) => (
        <div key={label} className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {label}
            <Icon className={`h-4 w-4 ${className}`} />
          </div>
          <p className={`mt-2 font-heading text-2xl font-semibold ${className}`}>{formatMoney(value)}</p>
        </div>
      ))}
    </div>
  );
}