import React, { useEffect, useState } from "react";
import { Wallet, ShieldCheck, ChevronRight } from "lucide-react";
import ProfileHero from "@/components/account/ProfileHero";
import ReferralCard from "@/components/account/ReferralCard";
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
      <ProfileHero identity={identity} data={data} />

      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-left shadow-[0_0_40px_-10px_rgba(16,185,129,0.55)] transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Wallet className="h-6 w-6 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-base font-bold text-white">Withdraw Funds</p>
            <p className="text-[11px] text-emerald-50/85">USDT · BEP20 / Polygon PoS · TON (Gram)</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-white" />
        </div>
      </button>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className="font-heading text-base font-bold">My Withdrawals</h2>
        </div>
        <WithdrawList withdrawals={data?.withdrawals || []} />
      </section>

      {referralLink && <ReferralCard referralLink={referralLink} />}

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