import React from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { LOGOS } from "@/components/deposit/logos";
import TonWalletControls from "@/components/deposit/TonWalletControls";
import { useAppLang } from "@/lib/AppLanguageContext";

export default function TonStep({ request, status, checking, onCheck, onCancel }) {
  const { t } = useAppLang();
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-primary/25 bg-card p-4">
        <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/60 p-1.5">
              <img src={LOGOS.keeper} alt="Keeper Wallet" className="h-full w-full" />
            </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-primary">{t("tt.pay", { amount: request.amount_ton })}</p>
            <p className="text-[11px] text-muted-foreground">
              {t("tt.via", { amount: formatMoney(request.amount_usd) })}
            </p>
          </div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        </div>

        <TonWalletControls request={request} status={status} onCheck={onCheck} />

        <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("c.status")}</span>
          <span className="font-medium capitalize">{status || "pending"}</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={onCheck}
        disabled={checking}
        className="h-12 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        {checking ? t("c.checking") : t("ts.check")}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
        {t("ts.cancel")}
      </Button>
    </div>
  );
}