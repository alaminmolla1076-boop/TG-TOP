import React, { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createNumberOrder, setNumberOrderAddress } from "@/api/numberEscrow";
import { useAppLang } from "@/lib/AppLanguageContext";
import { escrowT } from "@/components/escrow/strings";
import { formatMoney } from "@/lib/format";

// Buys one +888 number through the on-chain escrow: the order holds the price
// plus the 5% service fee, then the buyer submits the TON wallet that must
// receive the Fragment NFT. Nothing is paid to the seller until an admin
// verifies the transfer.
export default function EscrowBuyDialog({ number, open, onClose, onDone }) {
  const { lang } = useAppLang();
  const t = (key) => escrowT(lang, key);
  const [step, setStep] = useState("summary");
  const [order, setOrder] = useState(null);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const price = Number(number?.price || 0);
  const fee = Math.round(price * 5) / 100;
  const total = Math.round((price + fee) * 100) / 100;

  function close() {
    setStep("summary");
    setOrder(null);
    setAddress("");
    setBusy(false);
    setError("");
    onClose();
  }

  async function createOrder() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await createNumberOrder(number.id);
      setOrder(res.order);
      setStep("address");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setBusy(false);
  }

  async function submitAddress(event) {
    event.preventDefault();
    if (busy || !order) return;
    setBusy(true);
    setError("");
    try {
      const res = await setNumberOrderAddress(order.id, address.trim());
      onDone?.(res.order);
      close();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="max-w-[360px] rounded-3xl border-ring/25 bg-card/95 text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-[17px] font-bold">
            {step === "summary" ? number?.phone_number : t("addressTitle")}
          </DialogTitle>
        </DialogHeader>

        {step === "summary" ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-2xl border border-ring/20 bg-ring/[.07] p-3 text-[11.5px] leading-relaxed text-muted-foreground">
              {t("note")}
            </p>
            <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/[.04] p-3 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("price")}</span>
                <span className="font-mono">{formatMoney(price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("fee")}</span>
                <span className="font-mono">{formatMoney(fee)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-2 text-[13px] font-semibold">
                <span>{t("total")}</span>
                <span className="bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] bg-clip-text font-display text-transparent">
                  {formatMoney(total)}
                </span>
              </div>
            </div>
            {error && <p className="text-[12px] text-red-400">{error}</p>}
            <button
              type="button"
              onClick={createOrder}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-gradient-to-br from-primary to-[#8E7DFF] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_10px_24px_-6px_rgba(108,92,231,.8)] transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[.97] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {t("continue")}
            </button>
          </div>
        ) : (
          <form onSubmit={submitAddress} className="flex flex-col gap-3">
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">{t("addressHint")}</p>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="UQ…"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-white/12 bg-black/25 px-3.5 py-3 font-mono text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring/50"
            />
            {error && <p className="text-[12px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy || address.trim().length < 40}
              className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-gradient-to-br from-primary to-[#8E7DFF] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_10px_24px_-6px_rgba(108,92,231,.8)] transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[.97] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {t("send")}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
