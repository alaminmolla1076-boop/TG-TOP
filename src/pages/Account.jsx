import React, { useEffect, useState } from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import ProfileHero from "@/components/account/ProfileHero";
import ReferralCard from "@/components/account/ReferralCard";
import WithdrawForm from "@/components/account/WithdrawForm";
import WithdrawList from "@/components/account/WithdrawList";
import AdminWithdrawals from "@/components/account/AdminWithdrawals";
import { useTgIdentity } from "@/lib/TgIdentityContext";

export default function Account() {
  const { identity, invoke } = useTgIdentity();
  const [data, setData] = useState(null);

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

  return (
    <div className="mx-auto max-w-md space-y-6">
      <ProfileHero identity={identity} data={data} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className="font-heading text-base font-bold">Withdraw USDT</h2>
        </div>
        <WithdrawForm onSubmitted={load} />
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