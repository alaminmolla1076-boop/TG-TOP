import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { LOGOS } from "@/components/deposit/logos";
import { useAppLang } from "@/lib/AppLanguageContext";

// Final step of the OKPay top-up — opens the hosted OKPay checkout and lets
// the user confirm once they've paid. The balance is credited automatically
// after OKPay confirms the transfer.
export default function OkpayStep({ request, status, checking, onCheck, onCancel }) {
  const { t } = useAppLang();
  function payNow() {
    const url = request?.pay_url;
    if (!url) return;
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.openLink === "function") tg.openLink(url);
    else window.open(url, "_blank");
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 rounded-2xl border border-primary/25 bg-card p-4">
        <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-3">
          <img src={LOGOS.okpay} alt="OKPay" className="h-9 w-9 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-primary">{t("tn.okpay")}</p>
            <p className="text-[11px] text-muted-foreground">{t("to.instant")}</p>
          </div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("to.amount")}</span>
          <span className="font-heading text-lg font-bold text-primary">{formatMoney(request?.amount)}</span>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t("to.desc", { amount: formatMoney(request?.amount) })}
        </p>

        <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("c.status")}</span>
          <span className="font-medium capitalize">{status || "pending"}</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={payNow}
        className="h-12 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        {t("to.payNow")} <ExternalLink className="ml-1.5 h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCheck}
        disabled={checking}
        className="h-12 rounded-full"
      >
        {checking ? t("c.checking") : t("to.paid")}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
        {t("ts.cancel")}
      </Button>
    </div>
  );
}