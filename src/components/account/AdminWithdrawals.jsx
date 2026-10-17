import React, { useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";

const panelClass =
  "rounded-2xl border border-[#23282d] bg-[#131518] px-4 py-3.5 text-[13px] text-[#9aa3ab] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]";

const approveBtn =
  "flex flex-1 items-center justify-center gap-[5px] rounded-full border border-[#F39C12] bg-[#F39C12] px-2.5 py-2 text-xs font-semibold tracking-[0.06em] text-[#1D2125] " +
  "transition-[background,color,box-shadow] duration-200 hover:shadow-[0_0_12px_rgba(243,156,18,0.6)] active:opacity-85 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50";
const rejectBtn =
  "flex flex-1 items-center justify-center gap-[5px] rounded-full border border-[#F39C12] bg-transparent px-2.5 py-2 text-xs font-semibold tracking-[0.06em] text-[#F39C12] " +
  "transition-[background,color,box-shadow] duration-200 hover:bg-[rgba(243,156,18,0.15)] active:opacity-85 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50";

export default function AdminWithdrawals({ pending, onChanged }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [busyId, setBusyId] = useState(null);

  async function review(w, action) {
    setBusyId(w.id);
    try {
      await invoke("reviewWithdrawal", { id: w.id, action });
      toast({
        title: action === "approve" ? "Withdrawal approved" : "Withdrawal rejected",
        description: action === "approve" ? `${formatMoney(Number(w.amount))} will be sent to the user's wallet.` : undefined,
      });
      onChanged && onChanged();
    } catch (err) {
      toast({
        title: "Action failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyId(null);
  }

  if (!pending || pending.length === 0) {
    return (
      <div className={`${panelClass} flex items-center gap-2.5`}>
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#F39C12] shadow-[0_0_6px_#F39C12]" />
        No pending withdrawals.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pending.map((w) => (
        <div key={w.id} className={panelClass}>
          <div className="flex items-center gap-2.5">
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#F39C12] shadow-[0_0_6px_#F39C12]" />
            <p className="flex-1 text-base font-light text-[#F39C12]">
              {formatMoney(Number(w.amount))}
            </p>
          </div>
          <p className="mt-1 text-xs text-[#9aa3ab]">
            {w.network} · {w.user_email} · {formatDate(w.created_date)}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-[#9aa3ab]">{w.wallet_address}</p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => review(w, "approve")}
              disabled={busyId === w.id}
              className={approveBtn}
            >
              <Check className="h-[13px] w-[13px]" strokeWidth={1.6} /> Approve
            </button>
            <button
              type="button"
              onClick={() => review(w, "reject")}
              disabled={busyId === w.id}
              className={rejectBtn}
            >
              <X className="h-[13px] w-[13px]" strokeWidth={1.6} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}