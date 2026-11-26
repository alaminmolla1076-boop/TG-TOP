import React from "react";
import { Gem } from "lucide-react";
import SellerCard from "./SellerCard";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — the Top Account Holder is the same seller card as everyone
// else, with a blue gem badge.
export default function TopHolderCapsule({ holder }) {
  const { t } = useAppLang();
  const label = t("mk.topHolder");
  return (
    <SellerCard
      seller={holder || { name: label, sold: 0 }}
      badge={{ tone: "blue", label, icon: <Gem className="h-2 w-2 shrink-0" strokeWidth={2.6} /> }}
    />
  );
}
