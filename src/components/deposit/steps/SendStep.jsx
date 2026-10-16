import React from "react";
import { ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { LOGOS } from "@/components/deposit/logos";
import TopUpInstructions from "@/components/deposit/TopUpInstructions";
import PaymentQrCard from "@/components/deposit/PaymentQrCard";
import PaymentCopyField from "@/components/deposit/PaymentCopyField";
import PaymentActions from "@/components/deposit/PaymentActions";
import TonStep from "@/components/deposit/steps/TonStep";

export default function SendStep({ request, status, checking, onCheck, onCancel, wallet }) {
  const isTon = request.network === "TON";
  const asset = isTon ? "TON" : "USDT";
  const address = isTon ? request.deposit_address : request.wallet_address;
  const exactAmount = String(isTon ? request.amount_ton : request.identify_amount);
  const qrValue = isTon ? `ton://transfer/${address}?amount=${request.nano_amount}` : address;
  return (
    <div className="grid gap-4">
      <section className="space-y-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary"><img src={LOGOS[request.network]} alt={request.network} className="h-7 w-7" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">{asset} payment</h2><p className="mt-1 text-[11px] text-muted-foreground">{request.network} network · {isTon ? `Credit ≈ ${formatMoney(request.amount_usd)}` : "Exact amount required"}</p></div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-topup-soft" />
        </div>
        <PaymentQrCard value={qrValue} asset={asset} network={request.network} />
        <PaymentCopyField label="Top-up address" value={address} />
        <PaymentCopyField label="Exact amount to send" value={exactAmount} displayValue={`${exactAmount} ${asset}`} prominent />
        <p className="text-[11px] leading-relaxed text-muted-foreground">Send exactly the amount shown, without rounding. Your unique amount identifies this top-up automatically.</p>
        {isTon && wallet?.account && <TonStep request={request} status={status} onCheck={onCheck} />}
      </section>
      <PaymentActions status={status} checking={checking} expiresAt={request.expires_at} onCheck={onCheck} onClose={onCancel} />
      <TopUpInstructions network={request.network} />
    </div>
  );
}