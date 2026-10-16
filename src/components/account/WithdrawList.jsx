import React from "react";
import { formatDate, formatMoney } from "@/lib/format";

const statusStyle = {
  pending: { dot: "bg-amber-400", label: "text-amber-500" },
  approved: { dot: "bg-emerald-400", label: "text-emerald-500" },
  rejected: { dot: "bg-red-400", label: "text-red-500" },
};

export default function WithdrawList({ withdrawals }) {
  if (!withdrawals.length) {
    return (
      <p className="rounded-2xl border border-[#E6E1D6] bg-white p-3.5 text-[13px] leading-snug text-[#5C6781]">
        No withdrawals yet.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {withdrawals.map((w) => {
        const s = statusStyle[w.status] || statusStyle.pending;
        return (
          <div key={w.id} className="rounded-2xl border border-[#E6E1D6] bg-white p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-base font-semibold text-[#2453E6]">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                {formatMoney(w.amount)}
              </p>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${s.label}`}>
                {w.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#5C6781]">
              {w.network} · {formatDate(w.created_date)}
            </p>
            <p className="mt-1 break-all font-mono text-[11px] text-[#5C6781]">{w.wallet_address}</p>
          </div>
        );
      })}
    </div>
  );
}