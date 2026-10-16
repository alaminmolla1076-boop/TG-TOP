import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { TrendingUp, Wallet, ShieldCheck } from "lucide-react";
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
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold leading-tight">Top Up USDT</h1>
          <p className="text-xs text-muted-foreground">
            Connect your Keeper Wallet — top-ups are verified automatically on-chain.
          </p>
        </div>
      </div>

      <DepositForm onApproved={load} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className="font-heading text-base font-bold">My Top-Ups</h2>
        </div>
        {data === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <DepositList deposits={deposits} />
        )}
      </section>

      {data?.role === "admin" && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="font-heading text-base font-bold">Pending Top-Ups — All Users</h2>
          </div>
          <AdminDeposits pending={data?.pending_deposits || []} onChanged={load} />
        </section>
      )}
    </div>
  );
}