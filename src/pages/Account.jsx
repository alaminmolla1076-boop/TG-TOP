import React, { useEffect, useState } from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import ProfileHeroCard from "@/components/account/ProfileHeroCard";
import ActionCards from "@/components/account/AccountCards";
import SectionHeader from "@/components/account/SectionHeader";
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
    <div className="flex flex-col gap-[18px] tracking-[0.04em]">
      <ProfileHeroCard identity={identity} data={data} />
      <ActionCards referralLink={referralLink} onWithdraw={() => setWizardOpen(true)} />

      <section className="flex flex-col gap-2.5">
        <SectionHeader icon={<Wallet className="h-3.5 w-3.5 text-[#F39C12]" strokeWidth={1.4} />}>
          My Withdrawals
        </SectionHeader>
        <WithdrawList withdrawals={data?.withdrawals || []} />
      </section>

      {data?.role === "admin" && (
        <section className="flex flex-col gap-2.5">
          <SectionHeader icon={<ShieldCheck className="h-3.5 w-3.5 text-[#F39C12]" strokeWidth={1.4} />}>
            Pending Withdrawals — All Users
          </SectionHeader>
          <AdminWithdrawals pending={data?.pending_withdrawals || []} onChanged={load} />
        </section>
      )}
    </div>
  );
}