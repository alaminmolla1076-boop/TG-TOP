import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AccountShop from "@/components/market/AccountShop";
import { Package, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/format";

const steps = [
  { no: "01", title: "Top up your balance", desc: "Deposit USDT from the Account tab — deposits are verified automatically on-chain." },
  { no: "02", title: "Browse the market", desc: "Pick any product below — all prices are in USDT." },
  { no: "03", title: "Buy instantly", desc: "Your balance is charged and the order is completed immediately." },
];

export default function Market() {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [products, setProducts] = useState(null);
  const [accountCountries, setAccountCountries] = useState(null);
  const [orders, setOrders] = useState([]);
  const [buyingId, setBuyingId] = useState(null);

  async function load() {
    const [catalog, my] = await Promise.all([
      invoke("getMarketProducts", {}),
      invoke("getMyData", {}),
    ]);
    setProducts(catalog.data.products || []);
    setAccountCountries(catalog.data.account_countries || []);
    setOrders(my.data.orders || []);
  }

  useEffect(() => {
    load().catch(() => setProducts([]));
  }, []);

  async function handleBuy(product) {
    setBuyingId(product.id);
    try {
      const res = await invoke("buyProduct", { product_id: product.id });
      toast({
        title: "Purchase completed",
        description: `${product.name} — new balance ${formatMoney(res.data.balance)}`,
      });
      load();
    } catch (err) {
      toast({
        title: "Purchase failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBuyingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold tracking-widest text-primary">
          TRUSTED DIGITAL MARKETPLACE
        </span>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-base font-semibold">Products</h2>
          <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
            {products?.length ?? 0} items
          </Badge>
        </div>
        {products === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products are available right now — check back soon.</p>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-lg">
                  {p.icon || p.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.description || p.unit_label || p.category || "General"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <p className="font-heading font-semibold text-primary">{formatMoney(p.price)}</p>
                  <Button size="sm" onClick={() => handleBuy(p)} disabled={buyingId === p.id}>
                    {buyingId === p.id ? "Buying…" : "Buy"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AccountShop countries={accountCountries} onBought={load} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-base font-semibold">My Orders</h2>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.product_name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{o.status}</p>
                </div>
                <p className="shrink-0 font-heading font-semibold text-primary">{formatMoney(o.price)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Simple Process</p>
        <h2 className="mt-1 font-heading text-2xl font-bold">How it works</h2>
        <div className="mt-3 space-y-3">
          {steps.map((s) => (
            <div key={s.no} className="flex gap-4 rounded-xl border border-border/60 bg-card p-4">
              <span className="font-heading text-3xl font-bold leading-none text-primary">{s.no}</span>
              <div>
                <h3 className="font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}