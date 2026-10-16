import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingBag, Smartphone, Wallet } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { useTgIdentity } from "@/lib/TgIdentityContext";

const depositStatusStyle = {
  approved: "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/10",
  pending: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/10",
};

export default function Home() {
  const { identity, invoke } = useTgIdentity();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    invoke("getMyData", {})
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.error || e.message));
  }, []);

  if (error) return <p className="text-sm text-destructive">Failed to load data: {error}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const firstName = identity?.first_name || "there";
  const deposits = data.deposits || [];
  const orders = data.orders || [];
  const sales = data.account_sales?.length ?? 0;
  const approvedTotal = deposits
    .filter((d) => d.status === "approved")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here's your TG TOP wallet summary.</p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Available Balance</p>
        <p className="mt-1 font-heading text-4xl font-bold text-primary">{formatMoney(data.balance)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {formatMoney(approvedTotal)} topped up in total
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/deposit">
            <Plus className="mr-1.5 h-4 w-4" /> Top Up USDT
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <ShoppingBag className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 font-heading text-lg font-bold">{orders.length}</p>
          <p className="text-[11px] text-muted-foreground">Orders</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <Smartphone className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 font-heading text-lg font-bold">{sales}</p>
          <p className="text-[11px] text-muted-foreground">Sales</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <Wallet className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 font-heading text-lg font-bold">{deposits.length}</p>
          <p className="text-[11px] text-muted-foreground">Top-Ups</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">Recent Top-Ups</h2>
        {deposits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No top-ups yet.</p>
        ) : (
          <div className="space-y-3">
            {deposits.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card p-4">
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-primary">{formatMoney(d.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.network} · {formatDate(d.created_date)}
                  </p>
                </div>
                <Badge className={depositStatusStyle[d.status] || depositStatusStyle.pending}>
                  {d.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet — visit the Market to buy.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((o) => (
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
    </div>
  );
}