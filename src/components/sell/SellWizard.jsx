import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, KeyRound, Loader2, PackageCheck, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import SellPhoneStep from "./steps/SellPhoneStep";
import SellCodeStep from "./steps/SellCodeStep";
import SellProcessStep from "./steps/SellProcessStep";
import SellDoneStep from "./steps/SellDoneStep";
import DesignStepTabs from "./DesignStepTabs";
import DesignStepWrap from "./DesignStepWrap";

const STEPS = [
  { key: "phone", label: "Number", icon: Smartphone },
  { key: "code", label: "Login code", icon: KeyRound },
  { key: "secure", label: "Login + 2FA", icon: ShieldCheck },
  { key: "stock", label: "In your stock", icon: PackageCheck },
];

// Step-by-step sell flow: the number → login code → system login + 2FA →
// stock steps appear one at a time, like the Top Up and Withdraw wizards.
export default function SellWizard({ variant = "concierge", onDone }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [step, setStep] = useState("phone"); // phone | code | secure | stock
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  async function sendCode(e) {
    e.preventDefault();
    if (!/^\+[0-9]{6,19}$/.test(phone.trim())) {
      toast({
        title: "Invalid number",
        description: "Enter the number in international format, e.g. +8801XXXXXXXXX",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    setSending(true);
    setStep("code"); // move to the login-code page right away, like Telegram's own flow
    try {
      const res = await invoke("sellSendCode", { phone_number: phone.trim() });
      setRequestId(res.data.request_id);
      toast({ title: "Login code sent", description: "Check the Telegram app of that number." });
    } catch (err) {
      toast({
        title: "Could not send the code",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setSending(false);
    setBusy(false);
  }

  async function verifyCode(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setStep("secure");
    try {
      const res = await invoke("sellVerifyCode", { request_id: requestId, phone_code: code.trim() });
      setResult(res.data);
      setStep("stock");
      onDone();
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      setStep("code");
    }
  }

  function reset() {
    setStep("phone");
    setPhone("");
    setCode("");
    setRequestId("");
    setResult(null);
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        {step === "code" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setStep("phone")}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            {variant === "concierge" ? "02 · Sell Account" : "Sell Account"}
          </p>
          {variant === "concierge" ? (
            <h1 className="font-display text-4xl font-bold leading-tight">
              {stepIndex + 1}
              <span className="text-base text-muted-foreground"> / {STEPS.length}</span>
            </h1>
          ) : (
            <h1 className="font-heading text-lg font-bold leading-tight">
              Step {stepIndex + 1} of {STEPS.length}
            </h1>
          )}
        </div>
      </div>

      <DesignStepTabs steps={STEPS} stepIndex={stepIndex} variant={variant} />

      <DesignStepWrap variant={variant}>
        <AnimatePresence mode="wait">
          <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
        >
          {step === "phone" && (
            <SellPhoneStep phone={phone} onPhone={setPhone} onSubmit={sendCode} busy={busy} />
          )}
          {step === "code" && (
            <SellCodeStep
              phone={phone}
              code={code}
              onCode={setCode}
              onSubmit={verifyCode}
              sending={sending}
              ready={!!requestId}
            />
          )}
          {step === "secure" && <SellProcessStep phone={phone} />}
          {step === "stock" && <SellDoneStep result={result} onReset={reset} />}
          </motion.div>
        </AnimatePresence>
      </DesignStepWrap>
    </div>
  );
}