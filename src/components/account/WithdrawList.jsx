import React from "react";
import { formatDate, formatMoney } from "@/lib/format";

const panelClass =
  "flex items-start gap-2.5 rounded-xl bg-[#22150f] px-4 py-3.5 text-[13px] text-[#C48B68] shadow-[inset_0_2px_8px_rgba(0,0,0,0.55)]";

const statusStyle = {
  pending: { dot: "bg-[#C48B68] shadow-[0_0_6px_#C48B68]", label: "text-[#C48B68]" },
  approved: { dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]", label: "text-emerald-400" },
  rejected: { dot: "bg-red-400 shadow-[0_0_6px_#f87171]", label: "text-red-400" },
};

export default function WithdrawList({ withdrawals }) {
  if (!withdrawals.length) {
    return (
      <div className={`${panelClass} items-center`}>
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#C48B68] shadow-[0_0_6px_#C48B68]" />
        No withdrawals yet.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {withdrawals.map((w) => {
        const s = statusStyle[w.status] || statusStyle.pending;
        return (
          <div key={w.id} className={panelClass}>
            <span className={`mt-1.5 h-[5px] w-[5px] shrink-0 rounded-full ${s.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-base font-medium text-[#C48B68]">{formatMoney(w.amount)}</p>
                <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${s.label}`}>
                  {w.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#b69880]">
                {w.network} · {formatDate(w.created_date)}
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-[#b69880]">{w.wallet_address}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}