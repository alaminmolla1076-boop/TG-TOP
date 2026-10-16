import React, { useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";

const approveBtn =
  "flex flex-1 items-center justify-center gap-1 rounded-full border border-[#2453E6] bg-[#2453E6] px-2.5 py-2 text-[13px] font-semibold text-white " +
  "transition-[background,color] duration-200 hover:bg-[#1B43C0] active:bg-[#17399F] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18233C] disabled:opacity-50";
const rejectBtn =
  "flex flex-1 items-center justify-center gap-1 rounded-full border border-[#2453E6] bg-white px-2.5 py-2 text-[13px] font-semibold text-[#2453E6] " +
  "transition-[background,color] duration-200 hover:bg-[#EEF2FE] active:bg-[#DCE4FD] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18233C] disabled:opacity-50";

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
      <p className="rounded-2xl border border-[#E6E1D6] bg-white p-3.5 text-[13px] leading-snug text-[#5C6781]">
        No pending withdrawals.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pending.map((w) => (
        <div key={w.id} className="rounded-2xl border border-[#E6E1D6] bg-white p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="shrink-0 text-base font-semibold text-[#2453E6]">
              {formatMoney(Number(w.amount))}
            </p>
            <div className="flex flex-1 gap-2">
              <button
                type="button"
                onClick={() => review(w, "approve")}
                disabled={busyId === w.id}
                className={approveBtn}
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => review(w, "reject")}
                disabled={busyId === w.id}
                className={rejectBtn}
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#5C6781]">
            {w.network} · {w.user_email} · {formatDate(w.created_date)}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-[#5C6781]">{w.wallet_address}</p>
        </div>
      ))}
    </div>
  );
}