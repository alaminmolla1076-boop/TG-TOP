import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, Users } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useTgIdentity } from "@/lib/TgIdentityContext";

// Market seller list: each seller row expands to show the countries they sell,
// the price they set and a Buy button (Supabase purchaseAccount does the claim).
export default function SellerShop({ sellers, onBought }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [openId, setOpenId] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  async function handleBuy(seller, c) {
    setBusyKey(`${seller.id}:${c.country_iso}`);
    try {
      const res = await invoke("buySession", {
        country_iso: c.country_iso,
        quantity: 1,
        seller_email: seller.email,
      });
      toast({
        title: "Session purchased",
        description: `Account sessions were sent to your Telegram chat — new balance ${formatMoney(res.data.balance)}`,
      });
      onBought && onBought();
    } catch (err) {
      toast({
        title: "Purchase failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyKey(null);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-base font-semibold">Account Sellers</h2>
        <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
          {sellers?.length ?? 0} sellers
        </Badge>
      </div>
      {sellers === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sellers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sellers with stock right now — check back soon.</p>
      ) : (
        <div className="space-y-3">
          {sellers.map((s) => {
            const open = openId === s.id;
            return (
              <div key={s.id} className="rounded-xl border border-border/60 bg-card">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  {s.photo_url ? (
                    <img
                      src={s.photo_url}
                      alt={s.name}
                      className="h-11 w-11 shrink-0 rounded-full border border-primary/30 object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-heading text-lg font-bold text-primary">
                      {s.name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.username ? `@${s.username} · ` : ""}ID: {s.telegram_id || s.id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge className="shrink-0 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
                    {s.countries.length} {s.countries.length === 1 ? "country" : "countries"}
                  </Badge>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="space-y-3 border-t border-border/60 p-4">
                    {s.countries.map((c) => (
                      <div
                        key={c.country_iso}
                        className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-base">
                          {c.flag || c.country_iso}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{c.country_name}</p>
                          <p className="text-xs text-muted-foreground">{c.stock} in stock</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <p className="font-heading font-semibold text-primary">{formatMoney(c.price)}</p>
                          <Button size="sm" onClick={() => handleBuy(s, c)} disabled={busyKey !== null}>
                            {busyKey === `${s.id}:${c.country_iso}` ? "Buying…" : "Buy"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}