import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { LOGOS } from "@/components/deposit/logos";

// Final step of the OKPay top-up — opens the hosted OKPay checkout and lets
// the user confirm once they've paid. The balance is credited automatically
// after OKPay confirms the transfer.
export default function OkpayStep({ request, status, checking, onCheck, onCancel }) {
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
            <p className="text-sm font-bold text-primary">Top Up with Okpay</p>
            <p className="text-[11px] text-muted-foreground">instant USDT payment</p>
          </div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</span>
          <span className="font-heading text-lg font-bold text-primary">{formatMoney(request?.amount)}</span>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Tap Pay Now to open the secure OKPay checkout and pay {formatMoney(request?.amount)} in USDT. Your
          balance is credited automatically once the payment is confirmed — no TXID needed.
        </p>

        <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium capitalize">{status || "pending"}</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={payNow}
        className="h-12 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        Pay Now <ExternalLink className="ml-1.5 h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCheck}
        disabled={checking}
        className="h-12 rounded-full"
      >
        {checking ? "Checking…" : "I've Paid — Check Status"}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
        Cancel Request
      </Button>
    </div>
  );
}