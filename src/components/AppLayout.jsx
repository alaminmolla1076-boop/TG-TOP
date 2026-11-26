import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Wallet } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopSidebar from "@/components/DesktopSidebar";
import MenuDrawer from "@/components/MenuDrawer";
import { formatMoney } from "@/lib/format";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useTelegramBackButton } from "@/lib/useTelegramBackButton";

export default function AppLayout() {
  const { fetchMyData } = useTgIdentity();
  useTelegramBackButton();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const updateBalance = (event) => setBalance(event.detail.balance);
    window.addEventListener("tg-balance-updated", updateBalance);
    fetchMyData()
      .then((data) => setBalance(data.balance))
      .catch(() => setBalance(0));
    return () => window.removeEventListener("tg-balance-updated", updateBalance);
  }, []);

  return (
    <div className="lux-bg min-h-screen bg-background pb-[128px] tracking-[0.04em] text-foreground lg:pb-10">
      <DesktopSidebar balance={balance} />
      <div className="lg:pl-[264px]">
        <header className="og-rise sticky top-0 z-40 lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-center px-4 py-2">
            <img
              src="/tgtop-logo.png"
              alt="TGTOP"
              className="h-16 w-16 object-contain"
            />
          </div>
        </header>
        <div className="og-rise sticky top-[60px] z-30 mx-auto flex max-w-md items-center justify-between pl-4 pr-0 py-3 lg:hidden">
          <MenuDrawer />
          <span className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap rounded-full rounded-r-none border border-white/10 bg-white/[.06] px-3 py-[5px] backdrop-blur-xl font-mono text-[13px] font-semibold text-ring shadow-[0_8px_20px_rgba(0,0,0,.35)] backdrop-blur-md">
            <Wallet className="h-3.5 w-3.5" strokeWidth={1.5} />
            {balance === null ? "\u2026" : formatMoney(balance)}
          </span>
        </div>
        <main className="mx-auto w-full max-w-md px-4 py-4 lg:max-w-6xl lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
