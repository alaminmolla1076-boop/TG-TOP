import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Gem, Wallet } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopSidebar from "@/components/DesktopSidebar";
import MenuDrawer from "@/components/MenuDrawer";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useTelegramBackButton } from "@/lib/useTelegramBackButton";

export default function AppLayout() {
  const { fetchMyData } = useTgIdentity();
  useTelegramBackButton();
  const [balance, setBalance] = useState(null);
  const { pathname } = useLocation();
  const { t } = useAppLang();

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
        <header
          className="og-rise sticky top-0 z-40 lg:hidden"
          style={{ paddingTop: "calc(max(var(--tg-content-safe-area-inset-top, 0px), 28px))" }}
        >
          <div className="mx-auto grid max-w-md grid-cols-[1fr_auto_1fr] items-start gap-2 pl-3 pr-0">
            <div className="mt-[38px] flex justify-start">
              <MenuDrawer />
            </div>
            <img
              src="/tgtop-logo.png"
              alt="TGTOP"
              className="-mt-[5px] h-20 w-20 object-contain"
            />
            <div className="mt-[38px] flex justify-end">
              <span className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap rounded-full rounded-r-none border border-white/10 bg-white/[.06] px-3 py-[5px] backdrop-blur-xl font-mono text-[13px] font-semibold text-ring shadow-[0_8px_20px_rgba(0,0,0,.35)] backdrop-blur-md">
                <Wallet className="h-3.5 w-3.5" strokeWidth={1.5} />
                {balance === null ? "\u2026" : formatMoney(balance)}
              </span>
            </div>
          </div>
          {pathname === "/" && (
            <div className="-mt-[5px] mx-auto flex max-w-md justify-center pb-1">
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-[linear-gradient(120deg,rgba(45,111,253,.16),rgba(245,196,81,.08))] px-3 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-[#A8C8FF]">
                <Gem className="h-3 w-3 shrink-0 text-[#6FA8FF]" strokeWidth={2} />
                <span className="truncate">{t("mk.badge")}</span>
              </span>
            </div>
          )}
        </header>
        <main className="mx-auto w-full max-w-md px-4 py-4 lg:max-w-6xl lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
