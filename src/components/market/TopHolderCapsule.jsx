import React from "react";
import { Coins } from "lucide-react";
import SellerCard from "./SellerCard";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — Top Account Holder: the shared seller card in its blue frame
// with a #1 badge and the holder's total accounts in stock.
export default function TopHolderCapsule({ holder }) {
  const { t } = useAppLang();
  const stock = ((holder && holder.countries) || []).reduce((n, c) => n + (c.stock || 0), 0);
  return (
    <SellerCard
      seller={holder || { name: t("mk.topHolder"), sold: 0 }}
      tone="blue"
      rank={1}
      stat={{ icon: <Coins className="h-3 w-3" strokeWidth={2.4} />, value: stock, label: t("mk.stockLabel") }}
    />
  );
}
