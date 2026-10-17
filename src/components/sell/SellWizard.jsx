import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import SellPhoneStep from "./steps/SellPhoneStep";
import SellCodeStep from "./steps/SellCodeStep";
import SellProcessStep from "./steps/SellProcessStep";
import SellDoneStep from "./steps/SellDoneStep";
import DesignStepTabs from "./DesignStepTabs";
import DesignStepWrap from "./DesignStepWrap";

const STEPS = [
  { key: "phone", label: "Number" },
  { key: "code", label: "Login code" },
  { key: "secure", label: "Login + 2FA" },
  { key: "stock", label: "In your stock" },
];

// Step-by-step sell flow: the number → login code → system login + 2FA →
// stock steps appear one at a time, like the Top Up and Withdraw wizards.
export default function SellWizard({ onDone }) {
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
    <section>
      <header className="flex items-center gap-3">
        {step === "code" && (
          <button
            type="button"
            aria-label="Back"
            onClick={() => setStep("phone")}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-[#4A423B] bg-[#2E2A28] text-white transition-[background-color,box-shadow,transform] duration-[180ms] ease-[ease] hover:bg-[#39322D] hover:shadow-[0_0_14px_#FFAA3333] active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFAA33] focus-visible:outline-offset-[3px]"
          >
            <ChevronLeft className="h-[17px] w-[17px]" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            02 · Sell Account
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[21px] font-bold leading-none">
            {stepIndex + 1}
            <span className="text-xs font-medium text-[#B8ADA2]">/ {STEPS.length}</span>
          </p>
        </div>
      </header>

      <DesignStepTabs steps={STEPS} stepIndex={stepIndex} />

      <DesignStepWrap>
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
    </section>
  );
}