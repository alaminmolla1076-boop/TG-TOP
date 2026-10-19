import React from "react";
import { FileWarning } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatDate } from "@/lib/format";

const panelClass =
  "rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";
const SCAM_TYPES = ["not_delivered", "invalid_account", "scam", "price_manipulation", "other"];

// Reports tab — seller reports submitted from the Report Seller page.
export default function AdminReportsTab({ reports, loading }) {
  const { t } = useAppLang();

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200/20 border-t-[#A29BFE]" />
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className={panelClass + " flex items-center gap-2.5 text-muted-foreground"}>
        <FileWarning className="h-4 w-4 shrink-0 text-[#A29BFE]" strokeWidth={1.5} />
        {t("adm.noReports")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {reports.map((r) => (
        <div key={r.id} className={panelClass + " flex flex-col gap-1.5"}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-foreground">
              @{r.seller_username}
              {r.seller_id ? " · " + r.seller_id : ""}
            </p>
            <span className="shrink-0 rounded-full border border-ring/[.28] bg-ring/[.14] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C9C4FF]">
              {r.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {SCAM_TYPES.includes(r.scam_type) ? t("rs.type." + r.scam_type) : r.scam_type}
          </p>
          {r.details && <p className="leading-relaxed text-[#a8a3cf]">{r.details}</p>}
          <p className="text-[11px] text-muted-foreground">
            {t("adm.reportedBy")}: {r.reporter_email} · {formatDate(r.created_date)}
          </p>
        </div>
      ))}
    </div>
  );
}