import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import AmountStep from "@/components/deposit/steps/AmountStep";
import NetworkStep from "@/components/deposit/steps/NetworkStep";
import SendStep from "@/components/deposit/steps/SendStep";
import TonStep from "@/components/deposit/steps/TonStep";
import OkpayStep from "@/components/deposit/steps/OkpayStep";
import connectKeeperWallet from "@/components/deposit/connectKeeperWallet";
import { useAppLang } from "@/lib/AppLanguageContext";

export default function TopUpWizard({ onDone, onClose }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
  const [step, setStep] = useState("amount");
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState(null);
  const [network, setNetwork] = useState(null);
  const [request, setRequest] = useState(null);
  const [status, setStatus] = useState("pending");
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const pollRef = useRef(null);
  const requestIdRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function stopPolling() {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(() => checkStatus(true), 20000);
  }

  async function checkStatus(quiet) {
    setChecking(true);
    try {
      const okpay = networkRef.current === "OKPAY";
      const res = await invoke(
        okpay ? "checkOkpayOrder" : networkRef.current === "TON" ? "tonTopUp" : "verifyUsdtDeposit",
        okpay ? { topup_id: requestIdRef.current } : {
          action: "check",
          request_id: requestIdRef.current,
        }
      );
      setStatus(res.data.status);
      if (res.data.status === "approved") {
        toast({ title: t("td.confirmed"), description: t("td.confirmedDesc") });
        stopPolling();
        onDone && onDone();
      } else if (res.data.status === "rejected") {
        toast({ title: t("dp.rejectedToast"), variant: "destructive" });
        stopPolling();
        onDone && onDone();
      }
    } catch (err) {
      if (!quiet) {
        toast({
          title: t("td.checkFailed"),
          description: err.response?.data?.error || err.message,
          variant: "destructive",
        });
      }
    }
    setChecking(false);
  }

  async function startTopUp(selectedNetwork) {
    if (creating) return;
    setNetwork(selectedNetwork);
    networkRef.current = selectedNetwork;
    setCreating(true);
    try {
      if (selectedNetwork === "TON") {
        const wallet = await connectKeeperWallet();
        if (!wallet) return;
        if (wallet.account.chain !== "-239") {
          throw new Error(t("td.mainnet"));
        }
      }
      if (selectedNetwork === "OKPAY") {
        const res = await invoke("createOkpayOrder", { amount: Number(amount) });
        requestIdRef.current = res.data.topup_id;
        setRequest({ ...res.data, amount: Number(amount), network: "OKPAY" });
        setStatus("pending");
        setStep("okpay");
        startPolling();
        return;
      }
      const res = await invoke(selectedNetwork === "TON" ? "tonTopUp" : "verifyUsdtDeposit", {
        action: "create",
        amount: Number(amount),
        network: selectedNetwork,
      });
      requestIdRef.current = res.data.request.request_id;
      setRequest(res.data.request);
      setStatus("pending");
      setStep(selectedNetwork === "TON" ? "ton" : "send");
      startPolling();
    } catch (err) {
      toast({
        title: t("td.createFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  function goBack() {
    if (step === "network") setStep("amount");
  }

  const steps = network === "TON" ? ["amount", "network", "ton"]
    : network === "OKPAY" ? ["amount", "network", "okpay"]
    : ["amount", "network", "send"];
  const stepIndex = steps.indexOf(step);
  const stepTitle =
    step === "send" || step === "ton" || step === "okpay"
      ? t("tw.complete")
      : t("tw.step", { i: stepIndex + 1, n: steps.length });

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        {stepIndex > 0 && step !== "send" && step !== "ton" && step !== "okpay" && (
          <Button type="button" variant="ghost" size="icon" onClick={goBack} disabled={creating} aria-label={t("c.back")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("tw.title")}</p>
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
            <AmountStep
              amount={amount}
              preset={preset}
              onPick={(v) => { setPreset(v); setAmount(String(v)); }}
              onCustom={(v) => { setPreset(null); setAmount(v); }}
              onNext={() => setStep("network")}
            />
          )}
          {step === "network" && (
            <NetworkStep
              amount={amount}
              network={network}
              creating={creating}
              onSelect={startTopUp}
            />
          )}
          {step === "send" && (
            <SendStep
              request={request}
              status={status}
              checking={checking}
              onCheck={() => checkStatus(false)}
              onCancel={() => { stopPolling(); onClose && onClose(); }}
            />
          )}
          {step === "ton" && (
            <TonStep
              request={request}
              status={status}
              checking={checking}
              onCheck={() => checkStatus(false)}
              onCancel={() => { stopPolling(); onClose && onClose(); }}
            />
          )}
          {step === "okpay" && (
            <OkpayStep
              request={request}
              status={status}
              checking={checking}
              onCheck={() => checkStatus(false)}
              onCancel={() => { stopPolling(); onClose && onClose(); }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}