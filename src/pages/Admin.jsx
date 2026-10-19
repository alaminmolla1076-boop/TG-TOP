import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Banknote, FileWarning, History as HistoryIcon, ShieldCheck, Users } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useTelegramBackButton } from "@/lib/useTelegramBackButton";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminReportsTab from "@/components/admin/AdminReportsTab";
import AdminWithdrawalsTab from "@/components/admin/AdminWithdrawalsTab";
import AdminHistoryTab from "@/components/admin/AdminHistoryTab";

const BACKDROP_URL =
  "https://media.base44.com/images/public/6ad1ec4d9f3d182acc871a46/7a1e5277e_generated_a945c853.jpg";

// Admin panel — Glass Dashboard: frosted KPI pods, pill tabs and glass cards.
// Only for admins: the page gates on the role, and every backing function
// re-checks it server-side.
export default function Admin() {
  useTelegramBackButton();
  const { t } = useAppLang();
  const { fetchMyData, invoke } = useTgIdentity();
  const [role, setRole] = useState(null); // null = loading
  const [tab, setTab] = useState("users");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMyData()
      .then((d) => setRole(d?.role || "user"))
      .catch(() => setRole("user"));
  }, [fetchMyData]);

  const load = () =>
    invoke("adminData", {})
      .then((res) => setData(res.data))
      .catch(() => setData(null));

  useEffect(() => {
    if (role === "admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (role === null) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200/20 border-t-[#A29BFE]" />
      </div>
    );
  }
  if (role !== "admin") return <Navigate to="/" replace />;

  const pending = data?.pending_withdrawals || [];
  const tabs = [
    { key: "users", label: t("adm.tabUsers"), icon: Users },
    { key: "withdrawals", label: t("adm.tabWithdrawals"), icon: Banknote, badge: pending.length },
    { key: "reports", label: t("adm.tabReports"), icon: FileWarning },
    { key: "history", label: t("adm.tabHistory"), icon: HistoryIcon },
  ];

  return (
    <div className="relative">
      <img aria-hidden src={BACKDROP_URL} alt="" className="adm-bg" />
      <div aria-hidden className="adm-scrim" />
      <div className="relative z-[1] flex flex-col gap-4">
        <div className="adm-hd">
          <span className="adm-ic">
            <ShieldCheck className="h-5 w-5 text-[#A29BFE]" strokeWidth={1.6} />
          </span>
          <div>
            <p className="adm-eb">{t("menu.admin")}</p>
            <h1 className="adm-h1 font-heading">{t("adm.heading")}</h1>
          </div>
        </div>

        <div className="adm-kpi">
          <div className="adm-pod">
            <b>{data ? data.users_count ?? 0 : "–"}</b>
            <span>{t("adm.tabUsers")}</span>
          </div>
          <div className="adm-pod">
            <b>{data ? pending.length : "–"}</b>
            <span>{t("adm.tabWithdrawals")}</span>
          </div>
          <div className="adm-pod">
            <b>{data ? (data.reports || []).length : "–"}</b>
            <span>{t("adm.tabReports")}</span>
          </div>
        </div>

        <div className="adm-tabs">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button
              type="button"
              key={key}
              onClick={() => setTab(key)}
              className={"adm-tab" + (tab === key ? " on" : "")}
            >
              <Icon className="h-[14px] w-[14px] shrink-0" strokeWidth={2} />
              <span className="truncate">{label}</span>
              {badge > 0 && <span className="adm-bd">{badge}</span>}
            </button>
          ))}
        </div>

        {tab === "users" && <AdminUsersTab />}
        {tab === "withdrawals" && (
          <AdminWithdrawalsTab pending={pending} loading={!data} onChanged={load} />
        )}
        {tab === "reports" && <AdminReportsTab reports={data?.reports || []} loading={!data} />}
        {tab === "history" && <AdminHistoryTab data={data} loading={!data} />}
      </div>
    </div>
  );
}