import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, Send } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

const CHANNEL_URL = "https://t.me/tgtop_official";

// Page-closing footer: legal links, support channel and copyright.
export default function LegalFooter() {
  const { t } = useAppLang();
  return (
    <footer className="mk-sec -mx-4 flex flex-col gap-4 border-t border-[#A29BFE]/15 px-4 pb-6 pt-5">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5">
        <Link
          to="/privacy"
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#a8a3cf] transition-colors hover:text-[#A29BFE]"
        >
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("ft.privacy")}
        </Link>
        <Link
          to="/terms"
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#a8a3cf] transition-colors hover:text-[#A29BFE]"
        >
          <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("ft.terms")}
        </Link>
        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#a8a3cf] transition-colors hover:text-[#A29BFE]"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("ft.support")}
        </a>
      </div>
      <p className="text-center text-[10px] uppercase tracking-[.14em] text-muted-foreground">
        {t("ft.rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}