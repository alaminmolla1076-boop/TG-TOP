import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { CheckCircle2, Loader2, PackageCheck, ShieldCheck, Smartphone } from "lucide-react";

const STEPS = [
  { label: "Number", icon: Smartphone },
  { label: "Login code", icon: Loader2 },
  { label: "Login + 2FA", icon: ShieldCheck },
  { label: "In your stock", icon: PackageCheck },
];

// Step-by-step sell flow, matching the Supabase system: send a Telegram login
// code to the seller's number → seller enters the code → the system signs in,
// adds a 2FA password and puts the account into the seller's stock.
export default function SellWizard({ onDone }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [step, setStep] = useState("phone"); // phone | code | done
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const activeIndex = step === "phone" ? 0 : step === "code" ? 1 : 4;

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
    setBusy(true);
    try {
      const res = await invoke("sellVerifyCode", { request_id: requestId, phone_code: code.trim() });
      setResult(res.data);
      setStep("done");
      onDone();
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusy(false);
  }

  function reset() {
    setStep("phone");
    setPhone("");
    setCode("");
    setRequestId("");
    setResult(null);
  }

  return (
    <div className="grid gap-4 rounded-xl border border-border/60 bg-card p-4">
      <ol className="grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          const Icon = s.icon;
          return (
            <li
              key={s.label}
              className={`grid gap-1 rounded-lg border px-1.5 py-2 text-center ${
                done
                  ? "border-green-500/30 bg-green-500/10"
                  : active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/50 bg-muted/30"
              }`}
            >
              <Icon
                className={`mx-auto h-4 w-4 ${
                  done ? "text-green-400" : active ? "text-primary" : "text-muted-foreground"
                }`}
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

      {step === "phone" && (
        <form onSubmit={sendCode} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="s-phone">Telegram Phone Number</Label>
            <Input
              id="s-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801XXXXXXXXX"
              inputMode="tel"
              disabled={busy}
              required
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            We will send a Telegram login code to this number. Open that Telegram app to read it.
          </p>
          <Button type="submit" disabled={busy}>
            {busy ? "Sending code…" : "Send login code"}
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-medium">{phone}</p>
            <button type="button" onClick={reset} className="text-[11px] text-primary underline-offset-2 hover:underline">
              Change number
            </button>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-code">Login Code</Label>
            <Input
              id="s-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="The code from that Telegram app"
              inputMode="numeric"
              autoFocus
              disabled={busy}
              required
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            After verifying, the system signs in, adds a secure 2FA password and puts the account into your stock.
          </p>
          <Button type="submit" disabled={busy || !code.trim()}>
            {busy ? "Verifying — login, 2FA & stock…" : "Verify & add to stock"}
          </Button>
        </form>
      )}

      {step === "done" && result && (
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="font-medium">Account added to your stock</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {result.country ? `${result.country} · ` : ""}
            {result.phone} is now in your stock with a system 2FA password.
          </p>
          <Button variant="secondary" onClick={reset}>
            Sell another account
          </Button>
        </div>
      )}
    </div>
  );
}