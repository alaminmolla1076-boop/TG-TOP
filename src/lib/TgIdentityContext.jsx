import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const TgIdentityContext = createContext(null);

// Shared getMyData cache: one backend call serves the header and the page
// for 10s; concurrent callers join the same in-flight request.
const MY_DATA_CACHE_MS = 10000;
let myDataCache = null; // { data, ts }
let myDataInflight = null;

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
      // Full-screen mode: request immediately, retry on first tap
      // (some Telegram clients only grant it from a user gesture).
      const goFullscreen = () => {
        if (typeof tg.requestFullscreen === "function" && !tg.isFullscreen) {
          tg.requestFullscreen();
        }
      };
      goFullscreen();
      const once = () => {
        goFullscreen();
        document.removeEventListener("pointerdown", once);
      };
      document.addEventListener("pointerdown", once);
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

  // Shared account-data fetch with a short cache and in-flight de-duplication.
  // force=true (after a mutation) bypasses the cache and fetches fresh data.
  const fetchMyData = useCallback(
    (force = false) => {
      if (!force) {
        if (myDataCache && Date.now() - myDataCache.ts < MY_DATA_CACHE_MS) {
          return Promise.resolve(myDataCache.data);
        }
        if (myDataInflight) return myDataInflight;
      }
      const p = invoke("getMyData", {})
        .then((res) => {
          myDataCache = { data: res.data, ts: Date.now() };
          window.dispatchEvent(
            new CustomEvent("tg-balance-updated", { detail: { balance: res.data?.balance } })
          );
          return res.data;
        })
        .finally(() => {
          if (myDataInflight === p) myDataInflight = null;
        });
      myDataInflight = p;
      return p;
    },
    [invoke]
  );

  return (
    <TgIdentityContext.Provider value={{ identity, status, error, invoke, fetchMyData }}>
      {children}
    </TgIdentityContext.Provider>
  );
}

export function useTgIdentity() {
  const ctx = useContext(TgIdentityContext);
  if (!ctx) throw new Error("useTgIdentity must be used within TgIdentityProvider");
  return ctx;
}