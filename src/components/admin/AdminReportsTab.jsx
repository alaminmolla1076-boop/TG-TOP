import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatDate } from "@/lib/format";
import { AdminSpinner } from "./AdminUsersTab";

const SCAM_TYPES = ["not_logged_out"];

// Reports tab — seller reports submitted from the Report Seller page.
export default function AdminReportsTab({ reports, loading }) {
  const { t } = useAppLang();

  return (
    <div className="flex flex-col gap-4">
      <p className="adm-sec">{t("adm.tabReports")}</p>
      {loading ? (
        <AdminSpinner />
      ) : !reports || reports.length === 0 ? (
        <div className="adm-card">
          <p className="adm-emp">{t("adm.noReports")}</p>
        </div>
      ) : (
        reports.map((r) => (
          <div key={r.id} className="adm-card" style={{ gap: "7px" }}>
            <div className="adm-row" style={{ justifyContent: "space-between" }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "#ECEAFF",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{r.seller_username}
                {r.seller_id ? " · " + r.seller_id : ""}
              </p>
              <span className="adm-tag">{r.status}</span>
            </div>
            <p className="adm-mut">
              {SCAM_TYPES.includes(r.scam_type) ? t("rs.type." + r.scam_type) : r.scam_type}
            </p>
            {r.details && <p style={{ margin: 0, lineHeight: 1.5, color: "#a8a3cf" }}>{r.details}</p>}
            <p className="adm-mut" style={{ fontSize: 11 }}>
              {t("adm.reportedBy")}: {r.reporter_email} · {formatDate(r.created_date)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}