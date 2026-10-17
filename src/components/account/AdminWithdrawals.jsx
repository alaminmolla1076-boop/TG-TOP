import React, { useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";

const panelClass =
  "rounded-xl border border-border/50 bg-card/80 px-4 py-3.5 text-sm text-muted-foreground";

const approveBtn =
  "flex flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-full bg-primary px-2.5 py-[9px] text-xs font-semibold tracking-[0.06em] text-primary-foreground " +
  "transition-opacity duration-200 hover:opacity-90 active:opacity-85 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50";
const rejectBtn =
  "flex flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-full border border-border px-2.5 py-[9px] text-xs font-semibold tracking-[0.06em] text-primary " +
  "transition-colors duration-200 hover:bg-secondary active:opacity-85 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50";

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
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
        No pending withdrawals.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pending.map((w) => (
        <div key={w.id} className={`${panelClass} flex flex-col gap-2`}>
          <div className="flex items-center gap-2.5">
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
            <p className="flex-1 font-display text-lg font-bold text-primary">
              {formatMoney(Number(w.amount))}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {w.network} · {w.user_email} · {formatDate(w.created_date)}
          </p>
          <p className="break-all font-mono text-[11px] text-muted-foreground">{w.wallet_address}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => review(w, "approve")}
              disabled={busyId === w.id}
              className={approveBtn}
            >
              <Check className="h-[13px] w-[13px]" strokeWidth={2} /> Approve
            </button>
            <button
              type="button"
              onClick={() => review(w, "reject")}
              disabled={busyId === w.id}
              className={rejectBtn}
            >
              <X className="h-[13px] w-[13px]" strokeWidth={2} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}