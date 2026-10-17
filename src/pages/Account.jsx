import React, { useEffect, useState } from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import AccountHero from "@/components/account/AccountHero";
import StatsLedger from "@/components/account/StatsLedger";
import ServiceBand from "@/components/account/ServiceBand";
import SectionHeader from "@/components/account/SectionHeader";
import WithdrawList from "@/components/account/WithdrawList";
import AdminWithdrawals from "@/components/account/AdminWithdrawals";
import WithdrawWizard from "@/components/account/WithdrawWizard";
import { useTgIdentity } from "@/lib/TgIdentityContext";

const BACKDROP_URL =
  "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/53007f17e_generated_64743059.jpg";

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
    <div className="relative">
      <img
        aria-hidden
        src={BACKDROP_URL}
        alt=""
        className="fixed inset-x-0 top-0 z-0 h-[520px] w-full object-cover opacity-55"
      />
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-0 h-[520px] bg-gradient-to-b from-background/20 to-background"
      />
      <div className="relative z-10 flex flex-col gap-4">
        <AccountHero identity={identity} data={data} onWithdraw={() => setWizardOpen(true)} />
        <StatsLedger orders={data?.orders?.length ?? 0} sales={data?.account_sales?.length ?? 0} />

        <section className="og-rise flex flex-col gap-2.5 [animation-delay:.55s]">
          <SectionHeader icon={<Wallet className="h-3.5 w-3.5 text-ring" strokeWidth={1.5} />}>
            My Withdrawals
          </SectionHeader>
          <WithdrawList withdrawals={data?.withdrawals || []} />
        </section>

        <ServiceBand referralLink={referralLink} />

        {data?.role === "admin" && (
          <section className="og-rise flex flex-col gap-2.5 [animation-delay:.8s]">
            <SectionHeader icon={<ShieldCheck className="h-3.5 w-3.5 text-ring" strokeWidth={1.5} />}>
              Pending Withdrawals — All Users
            </SectionHeader>
            <AdminWithdrawals pending={data?.pending_withdrawals || []} onChanged={() => load(true)} />
          </section>
        )}
      </div>
    </div>
  );
}