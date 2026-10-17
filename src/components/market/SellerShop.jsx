import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, Users } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import CountryBuyPanel from "./CountryBuyPanel";

// Market seller list: tap a seller to open the countries they sell (flag +
// price + stock), tap a country to reveal its quantity buy panel (Buy 1 up to
// 1000, plus custom). Supabase's purchaseAccount does the claim, the chat
// delivery and the login-code capture (Get Code on the purchases list).
export default function SellerShop({ sellers, onBought }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [openId, setOpenId] = useState(null);
  const [selected, setSelected] = useState(null); // `${seller.id}:${country_iso}`
  const [busy, setBusy] = useState(false);

  async function handleBuy(seller, country, qty) {
    setBusy(true);
    try {
      const res = await invoke("buySession", {
        country_iso: country.country_iso,
        quantity: qty,
        seller_email: seller.email,
      });
      const bought = res.data.accounts || [];
      if (qty === 1 && bought[0]?.phone_number) {
        toast({
          title: "Account purchased",
          description: `${bought[0].phone_number} — tap Get Code below for its login code. New balance ${formatMoney(res.data.balance)}`,
        });
      } else {
        toast({
          title: "Purchase completed",
          description: `${res.data.count ?? bought.length} accounts — session formats were sent to your Telegram chat. New balance ${formatMoney(res.data.balance)}`,
        });
      }
      onBought && onBought();
    } catch (err) {
      toast({
        title: "Purchase failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusy(false);
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
              <div key={s.id} className="rounded-2xl border border-border/60 bg-card">
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : s.id);
                    setSelected(null);
                  }}
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
                    {s.countries.map((c) => {
                      const key = `${s.id}:${c.country_iso}`;
                      const isSel = selected === key;
                      return (
                        <div key={c.country_iso}>
                          <button
                            type="button"
                            onClick={() => setSelected(isSel ? null : key)}
                            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-[border-color,background-color] duration-200 ${
                              isSel
                                ? "border-ring/50 bg-secondary/70"
                                : "border-border/40 bg-background/40 hover:border-ring/30"
                            }`}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-base">
                              {c.flag || c.country_iso}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{c.country_name}</p>
                              <p className="text-xs text-muted-foreground">{c.stock} in stock</p>
                            </div>
                            <p className="shrink-0 bg-gradient-to-r from-ring to-primary bg-clip-text font-display text-sm font-bold text-transparent">
                              {formatMoney(c.price)}
                            </p>
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[.08em] text-ring">
                              Buy
                            </span>
                          </button>
                          {isSel && (
                            <CountryBuyPanel
                              country={c}
                              busy={busy}
                              onBuy={(qty) => handleBuy(s, c, qty)}
                            />
                          )}
                        </div>
                      );
                    })}
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