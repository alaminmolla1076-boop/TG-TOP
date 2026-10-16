import { useEffect, useState } from "react";
import { TonConnectUI } from "@tonconnect/ui";

let connector;
export function getTonConnector() {
  if (!connector) connector = new TonConnectUI({ manifestUrl: "https://tg-tops.base44.app/tonconnect-manifest.json" });
  return connector;
}

export default function useTonWallet() {
  const [wallet, setWallet] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const client = getTonConnector();
    setWallet(client.wallet);
    const unsubscribe = client.onStatusChange((value) => {
      if (active) { setWallet(value); setError(""); }
    });
    client.connectionRestored.then(() => {
      if (active) { setWallet(client.wallet); setRestoring(false); }
    }, () => { if (active) setRestoring(false); });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function connect() {
    setOpening(true);
    setError("");
    try {
      await getTonConnector().openSingleWalletModal("tonkeeper");
    } catch (err) {
      setError(err.message || "Could not open Keeper. Please try again.");
    } finally { setOpening(false); }
  }

  async function disconnect() {
    setError("");
    try { await getTonConnector().disconnect(); }
    catch (err) { setError(err.message || "Could not disconnect the wallet."); }
  }

  return { wallet, restoring, opening, error, connect, disconnect };
}