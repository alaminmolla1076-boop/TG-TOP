import React from "react";
import { formatDate, formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";

const panelClass =
  "flex items-start gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";

const statusStyle = {
  pending: { dot: "bg-ring shadow-[0_0_8px_#6C5CE7]", label: "text-ring" },
  approved: { dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]", label: "text-emerald-400" },
  rejected: { dot: "bg-red-400 shadow-[0_0_6px_#f87171]", label: "text-red-400" },
};

export default function WithdrawList({ withdrawals }) {
  const { t } = useAppLang();
  if (!withdrawals.length) {
    return (
      <div className={`${panelClass} items-center`}>
        <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
        {t("wl.none")}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {withdrawals.map((w) => {
        const s = statusStyle[w.status] || statusStyle.pending;
        return (
          <div key={w.id} className={panelClass}>
            <span className={`mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full ${s.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-lg font-bold text-primary">{formatMoney(w.amount)}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-[.08em] ${s.label}`}>
                  {w.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {w.network} · {formatDate(w.created_date)}
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{w.wallet_address}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}