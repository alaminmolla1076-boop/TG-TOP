import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import AdminUserRow from "./AdminUserRow";

export const AdminSpinner = () => (
  <div className="flex justify-center py-10">
    <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200/20 border-t-[#A29BFE]" />
  </div>
);

// Users tab — server-side search by username / ID, one AdminUserRow per user.
export default function AdminUsersTab() {
  const { t } = useAppLang();
  const { invoke } = useTgIdentity();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(null); // null = loading
  const [reloadKey, setReloadKey] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setUsers(null);
      invoke("adminUsers", { search })
        .then((res) => setUsers(res.data?.users || []))
        .catch(() => setUsers([]));
    }, 350);
    return () => clearTimeout(timer.current);
  }, [invoke, search, reloadKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-full border border-ring/[.25] bg-[rgba(45,38,78,.5)] px-4 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[#A29BFE]" strokeWidth={1.5} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("adm.searchPh")}
          maxLength={64}
          className="w-full bg-transparent text-[13px] text-foreground placeholder:text-[#a8a3cf]/60 focus:outline-none"
        />
      </div>

      {!users ? (
        <AdminSpinner />
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground">
          {t("adm.noUsers")}
        </div>
      ) : (
        users.map((u) => (
          <AdminUserRow key={u.email} user={u} onChanged={() => setReloadKey((k) => k + 1)} />
        ))
      )}
    </div>
  );
}