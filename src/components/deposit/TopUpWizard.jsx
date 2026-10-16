import React, { useState } from "react";
import AmountStep from "@/components/deposit/steps/AmountStep";
import NetworkStep from "@/components/deposit/steps/NetworkStep";
import SendStep from "@/components/deposit/steps/SendStep";
import TopUpHeader from "@/components/deposit/TopUpHeader";
import useTopUpRequest from "@/components/deposit/useTopUpRequest";
import useTonWallet from "@/components/deposit/useTonWallet";

export default function TopUpWizard({ onDone, onClose }) {
  const [step, setStep] = useState("amount");
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState(null);
  const [network, setNetwork] = useState(null);
  const payment = useTopUpRequest({ onDone });
  const walletState = useTonWallet();
  const stepIndex = ["amount", "network", "send"].indexOf(step);
  function close() { payment.stopPolling(); onClose?.(); }
  async function continueToPayment() {
    if (await payment.startTopUp(amount, network)) setStep("send");
  }
  return (
    <div className="grid min-h-[calc(100dvh-13rem)] content-start gap-6 pb-4">
      <TopUpHeader step={stepIndex} onBack={step === "network" ? () => setStep("amount") : null} onClose={close} disabled={payment.creating} />
      {step === "amount" && <AmountStep amount={amount} preset={preset}
        onPick={(value) => { setPreset(value); setAmount(String(value)); }}
        onCustom={(value) => { setPreset(null); setAmount(value); }} onNext={() => setStep("network")} />}
      {step === "network" && <NetworkStep amount={amount} network={network} creating={payment.creating}
        onSelect={setNetwork} onNext={continueToPayment} walletState={walletState}
        onConnect={() => { setNetwork("TON"); walletState.connect(); }} />}
      {step === "send" && <SendStep request={payment.request} status={payment.status} checking={payment.checking}
        wallet={walletState.wallet} onCheck={() => payment.checkStatus(false)} onCancel={close} />}
    </div>
  );
}