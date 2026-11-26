import React from "react";
import { Trophy } from "lucide-react";
import SellerCard from "./SellerCard";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market hero — the Top Seller wears the very same card design as every seller
// in the directory, marked with a trophy before the name.
export default function TopSellerCapsule({ topSeller }) {
  const { t } = useAppLang();
  const label = t("mk.topSeller");
  return (
    <SellerCard
      seller={topSeller || { name: label, sold: 0 }}
      icon={<Trophy className="h-3 w-3 shrink-0 text-[#F5C451]" strokeWidth={2.4} aria-label={label} />}
    />
  );
}
