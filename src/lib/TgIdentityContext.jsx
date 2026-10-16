import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const TgIdentityContext = createContext(null);

export function getTelegramWebApp() {
  return typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp
    ? window.Telegram.WebApp
    : null;
}

export function TgIdentityProvider({ children }) {
  const [identity, setIdentity] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "outside" | "error"
  const [error, setError] = useState("");

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
    }
    const initData = tg?.initData || "";
    if (!initData) {
      setStatus("outside");
      return;
    }
    base44.functions
      .invoke("telegramAuth", { initData })
      .then((res) => {
        setIdentity(res.data);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message);
        setStatus("error");
      });
  }, []);

  const invoke = useCallback((name, payload = {}) => {
    const initData = getTelegramWebApp()?.initData || "";
    return base44.functions.invoke(name, { ...payload, initData });
  }, []);

  return (
    <TgIdentityContext.Provider value={{ identity, status, error, invoke }}>
      {children}
    </TgIdentityContext.Provider>
  );
}

export function useTgIdentity() {
  const ctx = useContext(TgIdentityContext);
  if (!ctx) throw new Error("useTgIdentity must be used within TgIdentityProvider");
  return ctx;
}