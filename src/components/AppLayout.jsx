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
    <div className="min-h-screen bg-background pb-[104px] tracking-[0.04em] text-foreground">
      <header className="og-rise sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto_1fr] items-center px-4 py-3">
          <span />
          <Image
            src={LOGO_URL}
            alt="TGTOP"
            originWidth={1055}
            originHeight={1004}
            className="h-11 w-11 object-contain"
            fittingType="fit"
          />
          <span className="inline-flex items-center justify-end gap-1.5 justify-self-end whitespace-nowrap rounded-full border border-primary/40 px-3 py-[5px] font-mono text-[13px] font-semibold text-primary">
            <Gem className="h-3.5 w-3.5" strokeWidth={1.5} />
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