import React, { useEffect, useState } from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import ProfileHeroCard from "@/components/account/ProfileHeroCard";
import { StatsCard, ActionCards } from "@/components/account/AccountCards";
import WithdrawWizard from "@/components/account/WithdrawWizard";
import WithdrawList from "@/components/account/WithdrawList";
import AdminWithdrawals from "@/components/account/AdminWithdrawals";
import { useTgIdentity } from "@/lib/TgIdentityContext";

export default function Account() {
  const { identity, invoke } = useTgIdentity();
  const [data, setData] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  async function load() {
    try {
      const res = await invoke("getMyData", {});
      setData(res.data);
    } catch {
      setData({ balance: 0, orders: [], account_sales: [], withdrawals: [] });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const referralLink = identity?.telegram_id
    ? `https://t.me/tgtopsbot?startapp=${identity.telegram_id}`
    : "";

  if (wizardOpen) {
    return (
      <div className="mx-auto max-w-md">
        <WithdrawWizard
          balance={Number(data?.balance) || 0}
          onDone={() => { setWizardOpen(false); load(); }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <ProfileHeroCard identity={identity} data={data} />
      <StatsCard data={data} />
      <ActionCards referralLink={referralLink} onWithdraw={() => setWizardOpen(true)} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className="font-heading text-base font-bold">My Withdrawals</h2>
        </div>
        <WithdrawList withdrawals={data?.withdrawals || []} />
      </section>

      {data?.role === "admin" && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="font-heading text-base font-bold">Pending Withdrawals — All Users</h2>
          </div>
          <AdminWithdrawals pending={data?.pending_withdrawals || []} onChanged={load} />
        </section>
      )}
    </div>
  );
}