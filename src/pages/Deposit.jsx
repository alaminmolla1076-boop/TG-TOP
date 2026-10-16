import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import DepositForm from "@/components/deposit/DepositForm";
import DepositList from "@/components/deposit/DepositList";
import AdminDeposits from "@/components/deposit/AdminDeposits";

export default function Deposit() {
  const { invoke } = useTgIdentity();
  const [data, setData] = useState(null);

  async function load() {
    const res = await invoke("getMyData", {});
    setData(res.data);
  }

  useEffect(() => {
    load().catch(() => setData({ deposits: [] }));
  }, []);

  const deposits = data?.deposits || [];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Deposit USDT</h1>
      <DepositForm onApproved={load} />
      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">My Deposits</h2>
        {data === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <DepositList deposits={deposits} />
        )}
      </section>
      {data?.role === "admin" && (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold">Pending Deposits — All Users</h2>
          <AdminDeposits pending={data?.pending_deposits || []} onChanged={load} />
        </section>
      )}
    </div>
  );
}