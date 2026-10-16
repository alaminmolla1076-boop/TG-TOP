import { useEffect, useState } from "react";
import getTonConnector from "@/components/deposit/tonConnector";

export default function useKeeperWallet() {
  const [wallet, setWallet] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const connector = getTonConnector();
    const unsubscribe = connector.onStatusChange(
      (next) => { setWallet(next); setError(""); },
      (err) => setError(err.message),
    );
    connector.connectionRestored.then(() => {
      if (active) { setWallet(connector.wallet); setRestoring(false); }
    }, (err) => {
      if (active) { setError(err.message); setRestoring(false); }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function connect() {
    setError("");
    try {
      await getTonConnector().openSingleWalletModal("tonkeeper");
    } catch (err) {
      setError(err.message || "Could not open Keeper. Please try again.");
    }
  }

  async function disconnect() {
    setError("");
    try {
      await getTonConnector().disconnect();
    } catch (err) {
      setError(err.message);
    }
  }

  return { wallet, restoring, error, connect, disconnect };
}