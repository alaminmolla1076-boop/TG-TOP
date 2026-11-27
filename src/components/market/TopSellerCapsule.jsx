import React from "react";
import { TrendingUp, Trophy } from "lucide-react";
import SellerCard from "./SellerCard";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — Top Seller: the shared seller card in its gold frame with a
// #1 badge and the seller's total sales.
export default function TopSellerCapsule({ topSeller }) {
  const { t } = useAppLang();
  return (
    <SellerCard
      seller={topSeller || { name: t("mk.topSeller"), sold: 0 }}
      tone="gold"
      rank={1}
      head={{ icon: <Trophy className="h-3 w-3" strokeWidth={2.2} />, label: t("mk.topSellers") }}
      stat={{
        icon: <TrendingUp className="h-3 w-3" strokeWidth={2.4} />,
        value: (topSeller && topSeller.sold) || 0,
        label: t("mk.salesShort"),
      }}
    />
  );
}
