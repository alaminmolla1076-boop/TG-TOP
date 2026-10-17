import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Tags } from "lucide-react";
import { formatMoney } from "@/lib/format";

// Country-based price editor at the top of the Sell page: the seller sets the
// sale price for all their available numbers of a country — the market sells
// that stock at this price.
export default function StockPricesPanel({ stock, onSaved }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [edits, setEdits] = useState({});
  const [busyIso, setBusyIso] = useState(null);

  async function save(row, raw) {
    const price = Number(String(raw).trim());
    if (!String(raw).trim() || !Number.isFinite(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Enter a price greater than 0, e.g. 1.5",
        variant: "destructive",
      });
      return;
    }
    setBusyIso(row.country_iso);
    try {
      await invoke("setStockPrice", { country_iso: row.country_iso, price });
      toast({
        title: "Price updated",
        description: `${row.country_name} numbers now sell at ${formatMoney(price)}.`,
      });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[row.country_iso];
        return next;
      });
      onSaved && onSaved();
    } catch (err) {
      toast({
        title: "Could not update the price",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyIso(null);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Tags className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-base font-semibold">
          <span className="mr-1 font-display text-primary/80">01 ·</span> My Stock Prices
        </h2>
        <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
          {stock?.length ?? 0} countries
        </Badge>
      </div>
      {stock === null ? (
        <p className="text-sm text-[#9C9186]">Loading…</p>
      ) : stock.length === 0 ? (
        <p className="text-[11px] leading-[1.55] text-[#B8ADA2]">
          No numbers in your stock yet — sell one below, then set its price here.
        </p>
      ) : (
        <div className="divide-y divide-dotted divide-[#4A423B]">
          {stock.map((s) => {
            const value =
              edits[s.country_iso] !== undefined ? edits[s.country_iso] : s.price != null ? String(s.price) : "";
            return (
              <div key={s.country_iso} className="border-b border-dotted border-[#4A423B] py-3 first:pt-0 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#4A423B] bg-[#2E2A28] text-lg">
                    {s.flag || s.country_iso}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#E8DFD6]">{s.country_name}</p>
                    <p className="text-[11px] text-[#B8ADA2]">
                      {s.stock} in stock · buyers pay your price
                    </p>
                  </div>
                  <p className="shrink-0 font-heading text-sm font-semibold text-primary">
                    {s.price != null ? formatMoney(s.price) : "No price"}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">$</span>
                    <input
                      value={value}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [s.country_iso]: e.target.value }))}
                      placeholder="Set price"
                      inputMode="decimal"
                      disabled={busyIso === s.country_iso}
                      className="h-11 w-full rounded-[13px] border border-[#66594B] bg-[#2E2A28] pl-8 pr-3 text-sm text-white placeholder:text-[#82776C] transition-[border-color,box-shadow] duration-[180ms] ease-[ease] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_#FFAA3325] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => save(s, value)}
                    disabled={busyIso === s.country_iso}
                    className="h-11 shrink-0 cursor-pointer rounded-full bg-primary px-5 text-xs font-semibold text-[#24201E] shadow-[0_8px_20px_#FFAA3324] transition-[background-color,box-shadow,transform] duration-[180ms] ease-[ease] hover:bg-[#FFB84F] hover:shadow-[0_9px_24px_#FFAA3344] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFAA33] focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyIso === s.country_iso ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}