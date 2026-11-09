import React, { useEffect, useState } from "react";
import { Wallet, ShieldCheck, ShoppingBag, TrendingUp } from "lucide-react";
import AccountHero from "@/components/account/AccountHero";
import StatsLedger from "@/components/account/StatsLedger";
import ChannelLinks from "@/components/account/ChannelLinks";
import AccountHistory from "@/components/account/AccountHistory";
import ServiceBand from "@/components/account/ServiceBand";
import SectionHeader from "@/components/account/SectionHeader";
import AdminWithdrawals from "@/components/account/AdminWithdrawals";
import WithdrawWizard from "@/components/account/WithdrawWizard";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useAppLang } from "@/lib/AppLanguageContext";

const BACKDROP_URL =
  "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/53007f17e_generated_64743059.jpg";

const TAB_META = {
  orders: { key: "ah.orders", icon: ShoppingBag },
  sales: { key: "ah.sales", icon: TrendingUp },
  record: { key: "a.record", icon: Wallet },
};

export default function Account() {
  const { identity, fetchMyData } = useTgIdentity();
  const { t } = useAppLang();
  const [data, setData] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [tab, setTab] = useState("record");

  async function load(force = false) {
    try {
      setData(await fetchMyData(force));
    } catch {
      setData({ balance: 0, orders: [], account_sales: [], deposits: [], withdrawals: [] });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const referralLink = identity?.telegram_id
    ? "https://t.me/tgtopsbot?startapp=" + identity.telegram_id
    : "";

  if (wizardOpen) {
    return (
      <div className="mx-auto w-full max-w-md lg:max-w-xl">
        <WithdrawWizard
          balance={Number(data?.balance) || 0}
          onDone={() => {
            setWizardOpen(false);
            load(true);
          }}
        />
      </div>
    );
  }

  const meta = TAB_META[tab] || TAB_META.record;
  const TabIcon = meta.icon;
  const recordsCount = (data?.deposits?.length || 0) + (data?.withdrawals?.length || 0);

  return (
    <div className="relative">
      <img
        aria-hidden
        src={BACKDROP_URL}
        alt=""
        className="fixed inset-x-0 top-0 z-0 h-[520px] w-full object-cover opacity-55 lg:left-[264px] lg:h-[420px]"
      />
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-0 h-[520px] bg-gradient-to-b from-background/20 to-background lg:left-[264px] lg:h-[420px]"
      />
      <div className="relative z-10 flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-4">
          <AccountHero identity={identity} data={data} onWithdraw={() => setWizardOpen(true)} />
          <StatsLedger
            orders={data?.orders?.length ?? 0}
            sales={data?.account_sales?.length ?? 0}
            records={recordsCount}
            value={tab}
            onChange={setTab}
          />
          <ChannelLinks />

          <section className="og-rise flex flex-col gap-2.5 [animation-delay:.55s]">
            <SectionHeader icon={<TabIcon className="h-3.5 w-3.5 text-ring" strokeWidth={1.5} />}>
              {t(meta.key)}
            </SectionHeader>
            <AccountHistory tab={tab} data={data} />
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <ServiceBand referralLink={referralLink} />

          {data?.role === "admin" && (
            <section className="og-rise flex flex-col gap-2.5 [animation-delay:.8s]">
              <SectionHeader icon={<ShieldCheck className="h-3.5 w-3.5 text-ring" strokeWidth={1.5} />}>
                {t("wd.all")}
              </SectionHeader>
              <AdminWithdrawals pending={data?.pending_withdrawals || []} onChanged={() => load(true)} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
