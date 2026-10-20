import React from "react";
import { History, ShieldCheck, Flag } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import SectionHead from "@/components/market/SectionHead";

// Seller History — trust stats a buyer sees before buying from a seller:
// the total accounts they have sold on the market, and whether any reports
// exist against them (read-only, from the seller page data).
export default function SellerHistory({ seller }) {
  const { t } = useAppLang();
  const sold = Number(seller?.sold || 0);
  const reports = Number(seller?.reports || 0);

  return (
    <section className="mk-sec flex flex-col gap-3">
      <SectionHead
        icon={<History className="h-4 w-4" strokeWidth={1.5} />}
        title={t("sl.history")}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1 rounded-[22px] border border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]">
          <ShieldCheck className="h-[18px] w-[18px] text-[#A29BFE]" strokeWidth={1.5} />
          <p className="mt-1 text-2xl font-extrabold leading-none text-foreground tabular-nums">
            {sold}
          </p>
          <p className="text-[12px] font-semibold text-foreground">{t("sl.soldStat")}</p>
          <p className="text-[11px] leading-snug text-[#a8a3cf]">{t("sl.soldDesc")}</p>
        </div>
        <div
          className={
            reports > 0
              ? "flex flex-col gap-1 rounded-[22px] border border-[#e04646]/45 bg-[rgba(224,70,70,.1)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]"
              : "flex flex-col gap-1 rounded-[22px] border border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]"
          }
        >
          <Flag
            className={reports > 0 ? "h-[18px] w-[18px] text-[#ff8a8a]" : "h-[18px] w-[18px] text-[#A29BFE]"}
            strokeWidth={1.5}
          />
          <p className="mt-1 text-2xl font-extrabold leading-none text-foreground tabular-nums">
            {reports}
          </p>
          <p className="text-[12px] font-semibold text-foreground">{t("sl.reportsStat")}</p>
          <p className="text-[11px] leading-snug text-[#a8a3cf]">
            {reports > 0 ? t("sl.reportsCount", { n: reports }) : t("sl.noReports")}
          </p>
        </div>
      </div>
      {reports > 0 && (
        <p className="m-0 rounded-[16px] border border-[#e04646]/35 bg-[rgba(224,70,70,.1)] px-4 py-2.5 text-[12px] leading-snug text-[#ff8a8a]">
          {t("sl.reportsWarn")}
        </p>
      )}
    </section>
  );
}