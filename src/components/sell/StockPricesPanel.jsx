import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <h2 className="font-heading text-base font-semibold">My Stock Prices</h2>
        <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
          {stock?.length ?? 0} countries
        </Badge>
      </div>
      {stock === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : stock.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No numbers in your stock yet — sell one below, then set its price here.
        </p>
      ) : (
        <div className="space-y-3">
          {stock.map((s) => {
            const value =
              edits[s.country_iso] !== undefined ? edits[s.country_iso] : s.price != null ? String(s.price) : "";
            return (
              <div key={s.country_iso} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-lg">
                    {s.flag || s.country_iso}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.country_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.stock} in stock · buyers pay your price
                    </p>
                  </div>
                  <p className="shrink-0 font-heading font-semibold text-primary">
                    {s.price != null ? formatMoney(s.price) : "No price"}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">$</span>
                    <Input
                      value={value}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [s.country_iso]: e.target.value }))}
                      placeholder="Set price"
                      inputMode="decimal"
                      disabled={busyIso === s.country_iso}
                      className="pl-7"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => save(s, value)}
                    disabled={busyIso === s.country_iso}
                    className="px-4"
                  >
                    {busyIso === s.country_iso ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}