import React from "react";
import { formatDate, formatMoney } from "@/lib/format";

const panelClass =
  "rounded-2xl border border-[#23282d] bg-[#131518] px-4 py-3.5 text-[13px] text-[#9aa3ab] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]";

const statusStyle = {
  pending: { dot: "bg-[#F39C12] shadow-[0_0_6px_#F39C12]", label: "text-[#F39C12]" },
  approved: { dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]", label: "text-emerald-400" },
  rejected: { dot: "bg-red-400 shadow-[0_0_6px_#f87171]", label: "text-red-400" },
};

export default function WithdrawList({ withdrawals }) {
  if (!withdrawals.length) {
    return (
      <div className={`${panelClass} flex items-center gap-2.5`}>
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#F39C12] shadow-[0_0_6px_#F39C12]" />
        No withdrawals yet.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {withdrawals.map((w) => {
        const s = statusStyle[w.status] || statusStyle.pending;
        return (
          <div key={w.id} className={`${panelClass} flex items-start gap-2.5`}>
            <span className={`mt-1.5 h-[5px] w-[5px] shrink-0 rounded-full ${s.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-light text-[#F39C12]">{formatMoney(w.amount)}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${s.label}`}>
                  {w.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#9aa3ab]">
                {w.network} · {formatDate(w.created_date)}
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-[#9aa3ab]">{w.wallet_address}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}