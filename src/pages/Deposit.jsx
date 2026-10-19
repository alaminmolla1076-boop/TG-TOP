import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { ChevronRight, Wallet, ShieldCheck } from "lucide-react";
import TopUpWizard from "@/components/deposit/TopUpWizard";
import DepositList from "@/components/deposit/DepositList";
import AdminDeposits from "@/components/deposit/AdminDeposits";
import { LOGOS } from "@/components/deposit/logos";
import { useAppLang } from "@/lib/AppLanguageContext";

export default function Deposit() {
  const { invoke, fetchMyData } = useTgIdentity();
  const { t } = useAppLang();
  const [data, setData] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  async function load(force = false) {
    setData(await fetchMyData(force));
  }

  useEffect(() => {
    load().catch(() => setData({ deposits: [] }));
  }, []);

  if (wizardOpen) {
    return (
      <div className="mx-auto max-w-md">
        <TopUpWizard onDone={() => { setWizardOpen(false); load(true); }} onClose={() => setWizardOpen(false)} />
      </div>
    );
  }

  const deposits = data?.deposits || [];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className="w-full rounded-2xl bg-primary p-4 text-left transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 p-2">
            <img src={LOGOS.usdt} alt="USDT" className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-base font-bold text-primary-foreground">{t("dp.start")}</p>
            <p className="text-[11px] text-primary-foreground/80">{t("dp.startDesc")}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-primary-foreground" />
        </div>
      </button>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Wallet className="h-4 w-4" />
          </span>
          <h2 className="font-heading text-base font-bold">{t("dp.mine")}</h2>
        </div>
        {data === null ? (
          <p className="text-sm text-muted-foreground">{t("c.loading")}</p>
        ) : (
          <DepositList deposits={deposits} />
        )}
      </section>

      {data?.role === "admin" && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="font-heading text-base font-bold">{t("dp.pendingAll")}</h2>
          </div>
          <AdminDeposits pending={data?.pending_deposits || []} onChanged={() => load(true)} />
        </section>
      )}
    </div>
  );
}