import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Gem } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Image } from "@/components/ui/image";
import { formatMoney } from "@/lib/format";
import { LOGO_URL } from "@/lib/brand";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useTelegramBackButton } from "@/lib/useTelegramBackButton";

export default function AppLayout() {
  const { invoke } = useTgIdentity();
  useTelegramBackButton();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const updateBalance = (event) => setBalance(event.detail.balance);
    window.addEventListener("tg-balance-updated", updateBalance);
    invoke("getMyData", {})
      .then((res) => setBalance(res.data.balance))
      .catch(() => setBalance(0));
    return () => window.removeEventListener("tg-balance-updated", updateBalance);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
          <div className="w-14 shrink-0" />
          <Image src={LOGO_URL} alt="TGTOP" originWidth={1055} originHeight={1004} className="h-11 w-11 shrink-0 rounded-xl" fittingType="fit" />
          <span className="flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Gem className="h-3.5 w-3.5" />
            {balance === null ? "…" : formatMoney(balance)}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}