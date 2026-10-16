import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import AmountStep from "./steps/AmountStep";
import NetworkStep from "./steps/NetworkStep";
import MethodStep from "./steps/MethodStep";
import SendStep from "./steps/SendStep";

const STEP_ORDER = ["amount", "network", "method", "send"];

export default function TopUpWizard({ onDone, onClose }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [step, setStep] = useState("amount");
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState(null);
  const [network, setNetwork] = useState(null);
  const [method, setMethod] = useState(null);
  const [request, setRequest] = useState(null);
  const [status, setStatus] = useState("pending");
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const pollRef = useRef(null);
  const requestIdRef = useRef(null);

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
      const res = await invoke("verifyUsdtDeposit", {
        action: "check",
        request_id: requestIdRef.current,
      });
      setStatus(res.data.status);
      if (res.data.status === "approved") {
        toast({ title: "Top-up confirmed", description: "Your balance has been credited." });
        stopPolling();
        onDone && onDone();
      } else if (res.data.status === "rejected") {
        toast({ title: "Top-up rejected", variant: "destructive" });
        stopPolling();
        onDone && onDone();
      }
    } catch (err) {
      if (!quiet) {
        toast({
          title: "Could not check status",
          description: err.response?.data?.error || err.message,
          variant: "destructive",
        });
      }
    }
    setChecking(false);
  }

  async function startWithMethod(m) {
    setCreating(true);
    try {
      const res = await invoke("verifyUsdtDeposit", {
        action: "create",
        amount: Number(amount),
        network,
      });
      requestIdRef.current = res.data.request.request_id;
      setRequest(res.data.request);
      setMethod(m);
      setStatus("pending");
      setStep("send");
      startPolling();
    } catch (err) {
      toast({
        title: "Could not create top-up request",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setCreating(false);
  }

  function goBack() {
    if (step === "network") setStep("amount");
    else if (step === "method") setStep("network");
  }

  const stepIndex = STEP_ORDER.indexOf(step);
  const stepTitle =
    step === "send"
      ? "Complete Your Top-Up"
      : `Step ${stepIndex} of 3`;

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        {stepIndex > 0 && step !== "send" && (
          <Button type="button" variant="ghost" size="icon" onClick={goBack} aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Top Up USDT</p>
          <h1 className="font-heading text-lg font-bold leading-tight">{stepTitle}</h1>
        </div>
        <div className="flex gap-1.5">
          {STEP_ORDER.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i <= stepIndex ? "w-6 bg-gradient-to-r from-emerald-500 to-teal-500" : "w-1.5 bg-border"
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
              onSelect={setNetwork}
              onNext={() => setStep("method")}
            />
          )}
          {step === "method" && (
            <MethodStep
              network={network}
              amount={amount}
              creating={creating}
              onPick={startWithMethod}
            />
          )}
          {step === "send" && (
            <SendStep
              request={request}
              status={status}
              checking={checking}
              method={method}
              onCheck={() => checkStatus(false)}
              onCancel={() => { stopPolling(); onClose && onClose(); }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}