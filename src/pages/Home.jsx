import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import VaultBalanceCard from "@/components/home/VaultBalanceCard";
import ActivityFeed from "@/components/home/ActivityFeed";

export default function Home() {
  const { identity, fetchMyData } = useTgIdentity();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyData()
      .then((data) => setData(data))
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
      <VaultBalanceCard
        firstName={firstName}
        balance={data.balance}
        approvedTotal={approvedTotal}
        ordersCount={orders.length}
        salesCount={sales}
        topUpsCount={deposits.length}
      />
      <ActivityFeed deposits={deposits} orders={orders} />
    </div>
  );
}