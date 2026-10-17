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

const STEPS = [
  { key: "phone", label: "Number", icon: Smartphone },
  { key: "code", label: "Login code", icon: KeyRound },
  { key: "secure", label: "Login + 2FA", icon: ShieldCheck },
  { key: "stock", label: "In your stock", icon: PackageCheck },
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
    try {
      const res = await invoke("sellSendCode", { phone_number: phone.trim() });
      setRequestId(res.data.request_id);
      setStep("code");
      toast({ title: "Login code sent", description: "Check the Telegram app of that number." });
    } catch (err) {
      toast({
        title: "Could not send the code",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Sell Account</p>
          <h1 className="font-heading text-lg font-bold leading-tight">
            Step {stepIndex + 1} of {STEPS.length}
          </h1>
        </div>
      </div>

      <ol className="grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          const Icon = s.icon;
          return (
            <li
              key={s.key}
              className={`grid gap-1 rounded-lg border px-1.5 py-2 text-center ${
                done
                  ? "border-green-500/30 bg-green-500/10"
                  : active
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/50 bg-muted/30"
              }`}
            >
              <Icon
                className={`mx-auto h-4 w-4 ${
                  done ? "text-green-400" : active ? "text-primary" : "text-muted-foreground"
                } ${step === "secure" && s.key === "secure" ? "animate-pulse" : ""}`}
              />
              <span
                className={`text-[10px] leading-tight ${
                  done || active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

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
          {step === "code" && <SellCodeStep phone={phone} code={code} onCode={setCode} onSubmit={verifyCode} />}
          {step === "secure" && <SellProcessStep phone={phone} />}
          {step === "stock" && <SellDoneStep result={result} onReset={reset} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}