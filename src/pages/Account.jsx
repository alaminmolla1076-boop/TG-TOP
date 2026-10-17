import React, { useEffect, useState } from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import IdentityRail from "@/components/account/IdentityRail";
import BalancePanel from "@/components/account/BalancePanel";
import StatsLedger from "@/components/account/StatsLedger";
import ServiceBand from "@/components/account/ServiceBand";
import SectionHeader from "@/components/account/SectionHeader";
import WithdrawList from "@/components/account/WithdrawList";
import AdminWithdrawals from "@/components/account/AdminWithdrawals";
import WithdrawWizard from "@/components/account/WithdrawWizard";
import { useTgIdentity } from "@/lib/TgIdentityContext";

export default function Account() {
  const { identity, fetchMyData } = useTgIdentity();
  const [data, setData] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  async function load(force = false) {
    try {
      setData(await fetchMyData(force));
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
          onDone={() => { setWizardOpen(false); load(true); }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <IdentityRail identity={identity} />
      <BalancePanel data={data} onWithdraw={() => setWizardOpen(true)} />
      <StatsLedger orders={data?.orders?.length ?? 0} sales={data?.account_sales?.length ?? 0} />

      <section className="og-rise flex flex-col gap-2.5 [animation-delay:550ms]">
        <SectionHeader icon={<Wallet className="h-3.5 w-3.5 text-[#C48B68]" strokeWidth={1.4} />}>
          My Withdrawals
        </SectionHeader>
        <WithdrawList withdrawals={data?.withdrawals || []} />
      </section>

      <ServiceBand referralLink={referralLink} />

      {data?.role === "admin" && (
        <section className="og-rise flex flex-col gap-2.5 [animation-delay:550ms]">
          <SectionHeader icon={<ShieldCheck className="h-3.5 w-3.5 text-[#C48B68]" strokeWidth={1.4} />}>
            Pending Withdrawals — All Users
          </SectionHeader>
          <AdminWithdrawals pending={data?.pending_withdrawals || []} onChanged={() => load(true)} />
        </section>
      )}
    </div>
  );
}