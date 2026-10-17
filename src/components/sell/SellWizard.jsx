import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import useSellFlow from "@/components/sell/useSellFlow";
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
  const { step, phone, setPhone, code, setCode, requestId, result, busy, error, sendCode, verifyCode, back, reset } = useSellFlow(onDone);
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <section>
      <header className="flex items-center gap-3">
        {step === "code" && (
          <button
            type="button"
            aria-label="Back"
            onClick={back}
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
      {error && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

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