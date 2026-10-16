import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/ui/image";
import { Coins, ShoppingBag, Smartphone } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useTgIdentity } from "@/lib/TgIdentityContext";

export default function Account() {
  const { identity, invoke } = useTgIdentity();
  const [data, setData] = useState(null);

  useEffect(() => {
    invoke("getMyData", {})
      .then((res) => setData(res.data))
      .catch(() => setData({ balance: 0, orders: [], account_sales: [] }));
  }, []);

  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");
  const balance = data?.balance ?? null;
  const orders = data?.orders?.length ?? 0;
  const sales = data?.account_sales?.length ?? 0;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Account</h1>
      <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6 text-center">
        {identity?.photo_url ? (
          <Image
            src={identity.photo_url}
            alt={name}
            originWidth={160}
            originHeight={160}
            className="mx-auto h-16 w-16 rounded-full"
          />
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {(name || "?")[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium">{name}</p>
          {identity?.username && (
            <p className="text-sm text-muted-foreground">@{identity.username}</p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            Telegram ID: {identity?.telegram_id || "…"}
          </p>
        </div>
        <div className="flex justify-center gap-2">
          {identity?.role === "admin" && <Badge variant="secondary">Admin</Badge>}
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Balance</p>
          <p className="font-heading text-3xl font-bold text-primary">
            {balance === null ? "…" : formatMoney(balance)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <ShoppingBag className="h-4 w-4" /> {orders} orders
          </div>
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="h-4 w-4" /> {sales} sales
          </div>
        </div>
        <Button asChild className="w-fit">
          <Link to="/deposit">
            <Coins className="mr-2 h-4 w-4" /> Deposit USDT
          </Link>
        </Button>
      </div>
    </div>
  );
}