import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Smartphone } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useTgIdentity } from "@/lib/TgIdentityContext";

// Telegram account sessions for sale, purchased through the existing
// Supabase purchase function (country, price and stock come from it too).
export default function AccountShop({ countries, onBought }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [busyIso, setBusyIso] = useState(null);

  async function handleBuy(c) {
    setBusyIso(c.country_iso);
    try {
      const res = await invoke("buySession", { country_iso: c.country_iso, quantity: 1 });
      toast({
        title: "Session purchased",
        description: `${c.country_name} account — new balance ${formatMoney(res.data.balance)}`,
      });
      onBought && onBought();
    } catch (err) {
      toast({
        title: "Purchase failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyIso(null);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-base font-semibold">Telegram Sessions</h2>
        <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
          {countries?.length ?? 0} countries
        </Badge>
      </div>
      {countries === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : countries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions are available right now — check back soon.</p>
      ) : (
        <div className="space-y-3">
          {countries.map((c) => (
            <div key={c.country_iso} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-lg">
                {c.flag || c.country_iso}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.country_name}</p>
                <p className="text-xs text-muted-foreground">{c.stock} in stock</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <p className="font-heading font-semibold text-primary">{formatMoney(c.price)}</p>
                <Button size="sm" onClick={() => handleBuy(c)} disabled={busyIso === c.country_iso}>
                  {busyIso === c.country_iso ? "Buying…" : "Buy"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}