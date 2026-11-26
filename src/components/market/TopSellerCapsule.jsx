import React from "react";
import { Trophy } from "lucide-react";
import SellerCard from "./SellerCard";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — the Top Seller is the same seller card as everyone else, with
// a gold trophy badge.
export default function TopSellerCapsule({ topSeller }) {
  const { t } = useAppLang();
  const label = t("mk.topSeller");
  return (
    <SellerCard
      seller={topSeller || { name: label, sold: 0 }}
      badge={{ tone: "gold", label, icon: <Trophy className="h-2 w-2 shrink-0" strokeWidth={2.6} /> }}
    />
  );
}
