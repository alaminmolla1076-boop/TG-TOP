import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Wallet } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import MenuDrawer from "@/components/MenuDrawer";
import { Image } from "@/components/ui/image";
import { formatMoney } from "@/lib/format";
import { LOGO_URL } from "@/lib/brand";
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
    <div className="min-h-screen bg-background pb-[128px] tracking-[0.04em] text-foreground">
      <header className="og-rise sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-center px-4 py-2">
          <Image
            src={LOGO_URL}
            alt="TGTOP"
            originWidth={1055}
            originHeight={1004}
            className="h-16 w-16 object-contain"
            fittingType="fit"
          />
        </div>
      </header>
      <div className="nf-pod sticky top-[60px] z-30 mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <MenuDrawer />
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-card/75 px-3 py-[5px] font-mono text-[13px] font-semibold text-ring shadow-[0_8px_20px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-md">
          <Wallet className="h-3.5 w-3.5" strokeWidth={1.5} />
          {balance === null ? "…" : formatMoney(balance)}
        </span>
      </div>
      <main className="mx-auto max-w-md px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}