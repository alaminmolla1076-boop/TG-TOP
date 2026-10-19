import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import WithdrawAmountStep from "@/components/account/steps/WithdrawAmountStep";
import WithdrawNetworkStep from "@/components/account/steps/WithdrawNetworkStep";
import WithdrawAddressStep from "@/components/account/steps/WithdrawAddressStep";
import { NETWORK_META } from "./withdrawNetworks";
import { useAppLang } from "@/lib/AppLanguageContext";

export default function WithdrawWizard({ balance, onDone }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
  const [step, setStep] = useState("amount");
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState(null);
  const [network, setNetwork] = useState(null);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function goNextFromAmount() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 3 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
      toast({ title: t("wr.min"), variant: "destructive" });
      return;
    }
    if (value > balance) {
      toast({ title: t("wr.insufficient"), description: t("wr.upTo", { amount: `$${balance.toFixed(2)}` }), variant: "destructive" });
      return;
    }
    setStep("network");
  }

  function pickNetwork(value) {
    setNetwork(value);
    setStep("address");
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await invoke("requestWithdrawal", {
        amount: Number(amount),
        network,
        wallet_address: address.trim(),
      });
      toast({
        title: t("wr.requested"),
        description: t("wr.requestedDesc"),
      });
      onDone && onDone();
    } catch (err) {
      toast({
        title: t("wr.failed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ["amount", "network", "address"];
  const stepIndex = steps.indexOf(step);
  const stepTitle = t("tw.step", { i: stepIndex + 1, n: steps.length });

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        {stepIndex > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setStep(steps[Math.max(0, stepIndex - 1)])}
            aria-label={t("c.back")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("wd.title")}</p>
          <h1 className="font-heading text-lg font-bold leading-tight">{stepTitle}</h1>
        </div>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i <= stepIndex ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
        >
          {step === "amount" && (
            <WithdrawAmountStep
              amount={amount}
              preset={preset}
              balance={balance}
              onPick={(v) => { setPreset(v); setAmount(String(v)); }}
              onCustom={(v) => { setPreset(null); setAmount(v); }}
              onMax={() => { setPreset(null); setAmount(balance ? String(Number(balance.toFixed(2))) : ""); }}
              onNext={goNextFromAmount}
            />
          )}
          {step === "network" && (
            <WithdrawNetworkStep amount={amount} network={network} onSelect={pickNetwork} />
          )}
          {step === "address" && (
            <WithdrawAddressStep
              amount={amount}
              network={network}
              address={address}
              submitting={submitting}
              onAddress={setAddress}
              onSubmit={submit}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}