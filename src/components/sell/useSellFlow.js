import { useRef, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";

export default function useSellFlow(onDone) {
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
  const pending = useRef(false);
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  // Age bucket the seller picked for this sale — checked against the
  // account's real age (estimated from its Telegram user ID) at verify.
  const [age, setAge] = useState("regular");
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
      setError(t("sf.invalidPhone"));
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
        throw new Error(data?.error || t("sf.noConfirmCode"));
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
          ? t("sf.busyCode")
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
      const { data } = await invoke("sellVerifyCode", {
        request_id: requestId,
        phone_code: code.trim(),
        age_selection: age,
      });
      if (data?.success !== true) {
        throw new Error(data?.error || t("sf.noConfirmSave"));
      }
      setResult(data);
      setStep("stock");
      completed = true;
    } catch (err) {
      const raw = err.response?.data?.error || err.message || "";
      setError(
        raw.startsWith("AGE_MISMATCH:")
          ? t("sf.ageMismatch", { selected: ageLabel(raw.split(":")[1], t), actual: ageLabel(raw.split(":")[2], t) })
          : raw === "AGE_VERIFICATION_UNAVAILABLE"
          ? t("sf.ageUnavailable")
          : /compute resources/i.test(raw)
            ? t("sf.busyVerify")
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
    setAge("regular");
  }

  return { step, phone, setPhone, age, setAge, code, setCode, requestId, result, busy, error, sendCode, verifyCode, back, reset };
}