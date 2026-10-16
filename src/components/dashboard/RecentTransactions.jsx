import React from "react";
import { formatMoney, formatDate } from "@/lib/format";

export default function RecentTransactions({ transactions }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="font-heading text-lg font-semibold">Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No transactions yet — add one from the Sell tab.</p>
      ) : (
        <ul className="mt-4 divide-y">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{t.category || t.note || (t.type === "income" ? "Income" : "Expense")}</p>
                <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
              </div>
              <span className={`text-sm font-semibold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                {t.type === "income" ? "+" : "−"}{formatMoney(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}