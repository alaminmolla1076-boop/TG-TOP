import { useRef, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";

export default function useSellFlow(onDone) {
  const { invoke } = useTgIdentity();
  const pending = useRef(false);
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode(event) {
    event.preventDefault();
    if (pending.current) return;
    setError("");
    if (!/^\+[0-9]{6,19}$/.test(phone.trim())) {
      setError("Enter the number in international format, e.g. +8801XXXXXXXXX");
      return;
    }
    pending.current = true;
    setBusy(true);
    setRequestId("");
    setCode("");
    setResult(null);
    try {
      const { data } = await invoke("sellSendCode", { phone_number: phone.trim() });
      if (data?.success !== true || !data.request_id) {
        throw new Error(data?.error || "Supabase did not confirm the login-code request. Please try again.");
      }
      setPhone(phone.trim());
      setRequestId(data.request_id);
      setStep("code");
    } catch (err) {
      const raw = err.response?.data?.error || err.message || "";
      // Supabase edge functions sometimes hit their CPU wall right after
      // creating the request — tell the user to just press Send again.
      setError(
        /compute resources/i.test(raw)
          ? "Telegram is a bit busy right now — the code may still have been sent. Please press \"Send login code\" once more; if it fails again, wait a minute and retry."
          : raw
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    if (pending.current || !requestId || !code.trim()) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setStep("secure");
    let completed = false;
    try {
      const { data } = await invoke("sellVerifyCode", { request_id: requestId, phone_code: code.trim() });
      if (data?.success !== true) {
        throw new Error(data?.error || "Supabase did not confirm that the account was saved.");
      }
      setResult(data);
      setStep("stock");
      completed = true;
    } catch (err) {
      const raw = err.response?.data?.error || err.message || "";
      setError(
        /compute resources/i.test(raw)
          ? "Telegram is a bit busy right now — please press \"Continue\" once more; if it fails again, wait a minute and retry."
          : raw
      );
      setStep("code");
    } finally {
      pending.current = false;
      setBusy(false);
    }
    if (completed) onDone?.();
  }

  function back() {
    if (pending.current) return;
    setStep("phone");
    setCode("");
    setRequestId("");
    setResult(null);
    setError("");
  }

  function reset() {
    back();
    setPhone("");
  }

  return { step, phone, setPhone, code, setCode, requestId, result, busy, error, sendCode, verifyCode, back, reset };
}