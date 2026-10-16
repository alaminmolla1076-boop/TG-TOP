import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { ChevronRight, Wallet, ShieldCheck } from "lucide-react";
import TopUpWizard from "@/components/deposit/TopUpWizard";
import DepositList from "@/components/deposit/DepositList";
import AdminDeposits from "@/components/deposit/AdminDeposits";
import { LOGOS } from "@/components/deposit/logos";

export default function Deposit() {
  const { invoke } = useTgIdentity();
  const [data, setData] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  async function load() {
    const res = await invoke("getMyData", {});
    setData(res.data);
    window.dispatchEvent(new CustomEvent("tg-balance-updated", { detail: { balance: res.data.balance } }));
  }

  useEffect(() => {
    load().catch(() => setData({ deposits: [] }));
  }, []);

  if (wizardOpen) {
    return (
      <div className="mx-auto max-w-md">
        <TopUpWizard onDone={() => { setWizardOpen(false); load(); }} onClose={() => setWizardOpen(false)} />
      </div>
    );
  }

  const deposits = data?.deposits || [];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-left shadow-[0_0_40px_-10px_rgba(16,185,129,0.55)] transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 p-2">
            <img src={LOGOS.usdt} alt="USDT" className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-base font-bold text-white">Start Top Up</p>
            <p className="text-[11px] text-emerald-50/85">USDT · TRC20 / ERC20 / BEP20 · Keeper Wallet supported</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-white" />
        </div>
      </button>

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