import React from "react";
import { Outlet } from "react-router-dom";
import { TgIdentityProvider, useTgIdentity } from "@/lib/TgIdentityContext";
import TelegramGate from "@/components/TelegramGate";

function Gate() {
  const { status } = useTgIdentity();

  if (status === "ready") return <Outlet />;

  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <TelegramGate />;
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