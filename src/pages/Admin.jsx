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

// Admin panel — users (ban / balance / per-user history), seller reports,
// withdrawal approvals and global trade history. Only for admins: the page
// gates on the role, and every backing function re-checks it server-side.
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

  const tabs = [
    { key: "users", label: t("adm.tabUsers"), icon: Users, badge: 0 },
    {
      key: "withdrawals",
      label: t("adm.tabWithdrawals"),
      icon: Banknote,
      badge: (data?.pending_withdrawals || []).length,
    },
    { key: "reports", label: t("adm.tabReports"), icon: FileWarning, badge: 0 },
    { key: "history", label: t("adm.tabHistory"), icon: HistoryIcon, badge: 0 },
  ];

  return (
    <div className="mk-sec flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)]">
          <ShieldCheck className="h-5 w-5 text-[#A29BFE]" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A29BFE]">{t("menu.admin")}</p>
          <h1 className="font-heading text-lg font-bold text-foreground">{t("adm.heading")}</h1>
        </div>
      </div>

      <div className="flex gap-1 rounded-full border border-ring/[.22] bg-card/75 p-1.5">
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button
            type="button"
            key={key}
            onClick={() => setTab(key)}
            className={
              "relative flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold transition-colors duration-200 " +
              (tab === key
                ? "bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] text-white shadow-[0_4px_14px_rgba(108,92,231,.45)]"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            <Icon className="h-[14px] w-[14px] shrink-0" strokeWidth={2} />
            <span className="truncate">{label}</span>
            {badge > 0 && (
              <span className="absolute -top-1 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "users" && <AdminUsersTab />}
      {tab === "withdrawals" && (
        <AdminWithdrawalsTab
          pending={data?.pending_withdrawals || []}
          loading={!data}
          onChanged={load}
        />
      )}
      {tab === "reports" && <AdminReportsTab reports={data?.reports || []} loading={!data} />}
      {tab === "history" && <AdminHistoryTab data={data} loading={!data} />}
    </div>
  );
}