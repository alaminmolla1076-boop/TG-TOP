import React from "react";
import { Gem } from "lucide-react";
import SellerCard from "./SellerCard";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — the Top Account Holder wears the very same card design as every
// seller in the directory, marked with a gem before the name.
export default function TopHolderCapsule({ holder }) {
  const { t } = useAppLang();
  const label = t("mk.topHolder");
  return (
    <SellerCard
      seller={holder || { name: label, sold: 0 }}
      icon={<Gem className="h-3 w-3 shrink-0 text-[#6FA8FF]" strokeWidth={2.4} aria-label={label} />}
    />
  );
}
