import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { TgIdentityProvider, useTgIdentity } from "@/lib/TgIdentityContext";
import TelegramGate from "@/components/TelegramGate";
import SplashScreen from "@/components/SplashScreen";

// The splash plays for a minimum of ~3s on entry (logo glow + progress bar),
// then hands over as soon as the Telegram session is ready.
const SPLASH_MIN_MS = 3000;

function Gate() {
  const { status } = useTgIdentity();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  if (status === "ready" && splashDone) return <Outlet />;

  if (status === "outside" || status === "error") return <TelegramGate />;

  return <SplashScreen />;
}

// Layout route: identifies the user via the Telegram Mini App (auto sign-up),
// then renders the app pages. Shows a gate when opened outside Telegram.
export default function TgShell() {
  return (
    <TgIdentityProvider>
      <Gate />
    </TgIdentityProvider>
  );
}