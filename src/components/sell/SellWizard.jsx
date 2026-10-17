import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smartphone, KeyRound, ShieldCheck, PackageCheck } from "lucide-react";
import useSellFlow from "@/components/sell/useSellFlow";
import SellPhoneStep from "./steps/SellPhoneStep";
import SellCodeStep from "./steps/SellCodeStep";
import SellProcessStep from "./steps/SellProcessStep";
import SellDoneStep from "./steps/SellDoneStep";
import DesignStepWrap from "./DesignStepWrap";

// Watermark identity per page — a huge faint outlined glyph behind the heading.
const WATERMARKS = {
  phone: Smartphone,
  code: KeyRound,
  secure: ShieldCheck,
  stock: PackageCheck,
};

// Step-by-step sell flow: the number → login code → system login + 2FA →
// stock steps appear one at a time, like the Top Up and Withdraw wizards.
export default function SellWizard({ onDone }) {
  const { step, phone, setPhone, code, setCode, requestId, result, busy, error, sendCode, verifyCode, back, reset } = useSellFlow(onDone);
  const WatermarkIcon = WATERMARKS[step] || Smartphone;

  return (
    <section>
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[.08em] text-ring">
          02 · Sell Account
        </p>
      </header>
      {error && <p role="alert" className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <DesignStepWrap
        watermark={<WatermarkIcon className="h-[150px] w-[150px]" strokeWidth={0.9} />}
      >
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
                onBack={back}
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