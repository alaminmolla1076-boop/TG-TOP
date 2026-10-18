import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import PurchasedAccounts from "@/components/market/PurchasedAccounts";

// Dashboard — minimal for now: only the My Purchases history.
export default function Home() {
  const { invoke } = useTgIdentity();
  const [purchases, setPurchases] = useState(null);
  const [batches, setBatches] = useState(null);

  useEffect(() => {
    invoke("getPurchases", {})
      .then((res) => {
        setPurchases(res.data.purchases || []);
        setBatches(res.data.batches || []);
      })
      .catch(() => {
        setPurchases([]);
        setBatches([]);
      });
  }, []);

  return (
    <div className="flex flex-col gap-[22px]">
      <PurchasedAccounts
        purchases={purchases}
        batches={batches === null ? [] : batches}
        emptyText="No purchases yet — open the Market to buy an account."
      />
    </div>
  );
}