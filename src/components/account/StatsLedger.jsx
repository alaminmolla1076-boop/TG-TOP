import React from "react";
import { ShoppingBag, TrendingUp, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLang } from "@/lib/AppLanguageContext";

// Nordic Frost Glass — compact switcher: Orders / Sales / Record.
export default function StatsLedger({ orders, sales, records, value, onChange }) {
  const { t } = useAppLang();
  const items = [
    { key: "orders", label: t("a.orders"), count: orders, icon: ShoppingBag },
    { key: "sales", label: t("a.sales"), count: sales, icon: TrendingUp },
    { key: "record", label: t("a.record"), count: records, icon: ReceiptText },
  ];

  return (
    <section className="og-rise grid grid-cols-3 gap-2 [animation-delay:.35s]">
      {items.map(({ key, label, count, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-1.5 rounded-2xl border px-3 py-2.5 text-left transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "border-ring/55 bg-ring/[.16] shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_8px_20px_rgba(108,92,231,.28)]"
                : "border-ring/[.2] bg-card/60 hover:border-ring/40 hover:bg-accent/70"
            )}
          >
            <span
              className={cn(
                "flex w-full items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[.1em]",
                active ? "text-[#C9C4FF]" : "text-ring/80"
              )}
            >
              <Icon className="h-3 w-3 shrink-0" strokeWidth={1.8} />
              <span className="truncate">{label}</span>
            </span>
            <span className="font-display text-[21px] font-bold leading-none tabular-nums text-foreground">
              {count}
            </span>
          </button>
        );
      })}
    </section>
  );
}
