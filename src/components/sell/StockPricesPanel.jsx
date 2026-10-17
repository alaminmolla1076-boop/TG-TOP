import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Tags } from "lucide-react";
import { formatMoney } from "@/lib/format";

// Country-based price editor at the top of the Sell page: the seller sets the
// sale price for all their available numbers of a country — the market sells
// that stock at this price. Nordic Frost Glass — frosted lozenge rows.
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
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
        <Tags className="h-3.5 w-3.5" strokeWidth={1.5} />
        <h2 className="leading-[1.3]">My Stock Prices</h2>
        <Badge className="border border-ring/35 bg-ring/[.12] text-ring hover:bg-ring/[.12]">
          {stock?.length ?? 0} countries
        </Badge>
      </div>
      {stock === null ? (
        <div className="flex items-center gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
          Loading…
        </div>
      ) : stock.length === 0 ? (
        <div className="flex items-center gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
          No numbers in your stock yet — sell one below, then set its price here.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {stock.map((s) => {
            const value =
              edits[s.country_iso] !== undefined ? edits[s.country_iso] : s.price != null ? String(s.price) : "";
            return (
              <div
                key={s.country_iso}
                className="rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ring/25 bg-secondary/80 text-lg">
                    {s.flag || s.country_iso}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{s.country_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.stock} in stock · buyers pay your price
                    </p>
                  </div>
                  <p className="shrink-0 bg-gradient-to-r from-ring to-primary bg-clip-text font-display text-sm font-bold text-transparent">
                    {s.price != null ? formatMoney(s.price) : "No price"}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ring">$</span>
                    <input
                      value={value}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [s.country_iso]: e.target.value }))}
                      placeholder="Set price"
                      inputMode="decimal"
                      disabled={busyIso === s.country_iso}
                      className="h-11 w-full rounded-full border border-ring/25 bg-secondary/80 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_3px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => save(s, value)}
                    disabled={busyIso === s.country_iso}
                    className="h-11 shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] px-5 text-xs font-semibold uppercase tracking-[.06em] text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
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