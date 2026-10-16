import { useEffect, useRef, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";

export default function useTopUpRequest({ onDone }) {
  const { invoke } = useTgIdentity();
  const { toast } = useToast();
  const [request, setRequest] = useState(null);
  const [status, setStatus] = useState("pending");
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const pollRef = useRef(null);
  const activeRef = useRef(null);
  useEffect(() => () => clearInterval(pollRef.current), []);

  function stopPolling() {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }

  async function checkStatus(quiet = false) {
    if (!activeRef.current) return;
    setChecking(true);
    try {
      const active = activeRef.current;
      const res = await invoke(active.network === "TON" ? "tonTopUp" : "verifyUsdtDeposit", { action: "check", request_id: active.id });
      setStatus(res.data.status);
      if (res.data.status === "approved" || res.data.status === "rejected") {
        const approved = res.data.status === "approved";
        toast({ title: approved ? "Top-up confirmed" : "Top-up rejected", description: approved ? "Your balance has been credited." : undefined, variant: approved ? "default" : "destructive" });
        stopPolling();
        onDone?.();
      }
    } catch (err) {
      if (!quiet) toast({ title: "Could not check status", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally { setChecking(false); }
  }

  async function startTopUp(amount, network) {
    if (creating) return false;
    setCreating(true);
    try {
      const res = await invoke(network === "TON" ? "tonTopUp" : "verifyUsdtDeposit", { action: "create", amount: Number(amount), network });
      activeRef.current = { id: res.data.request.request_id, network };
      setRequest({ ...res.data.request, network });
      setStatus("pending");
      stopPolling();
      pollRef.current = setInterval(() => checkStatus(true), 20000);
      return true;
    } catch (err) {
      toast({ title: "Could not create top-up request", description: err.response?.data?.error || err.message, variant: "destructive" });
      return false;
    } finally { setCreating(false); }
  }

  return { request, status, checking, creating, startTopUp, checkStatus, stopPolling };
}