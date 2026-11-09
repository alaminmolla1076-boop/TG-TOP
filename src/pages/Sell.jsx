import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SellWizard from "@/components/sell/SellWizard";
import { useAppLang } from "@/lib/AppLanguageContext";

// Sell account — only the login sale: pick the age, log in the number,
// confirm the code. Stock and per-number prices stay on the Inventory page.
export default function Sell() {
  const { t } = useAppLang();
  return (
    <div className="mx-auto w-full max-w-md lg:max-w-xl">
      <Link
        to="/inventory"
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-ring/25 bg-card/70 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[.08em] no-underline text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} /> {t("inv.title")}
      </Link>
      <SellWizard />
    </div>
  );
}
