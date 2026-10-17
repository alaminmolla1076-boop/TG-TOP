import React from "react";
import { formatMoney } from "@/lib/format";

// One country lozenge row — flag + name + stock count + current price on top,
// inline $ price input + Save pill below. Nordic Frost Glass.
export default function StockPriceRow({ row, value, busy, onValue, onSave }) {
  return (
    <div className="rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ring/25 bg-secondary/80 text-lg">
          {row.flag || row.country_iso}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{row.country_name}</p>
          <p className="text-[11px] text-muted-foreground">
            {row.stock} in stock · buyers pay your price
          </p>
        </div>
        <p className="shrink-0 bg-gradient-to-r from-ring to-primary bg-clip-text font-display text-sm font-bold text-transparent">
          {row.price != null ? formatMoney(row.price) : "No price"}
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ring">$</span>
          <input
            value={value}
            onChange={(e) => onValue(e.target.value)}
            placeholder="Set price"
            inputMode="decimal"
            disabled={busy}
            className="h-11 w-full rounded-full border border-ring/25 bg-secondary/80 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_3px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="h-11 shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] px-5 text-xs font-semibold uppercase tracking-[.06em] text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}