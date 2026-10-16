import React, { useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";

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

  if (!pending || pending.length === 0) return <p className="text-sm text-muted-foreground">No pending withdrawals.</p>;

  return (
    <div className="space-y-3">
      {pending.map((w) => (
        <div key={w.id} className="rounded-2xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading text-lg font-bold text-emerald-400">{formatMoney(Number(w.amount))}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => review(w, "approve")}
                disabled={busyId === w.id}
                className="rounded-full bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
              >
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => review(w, "reject")} disabled={busyId === w.id} className="rounded-full">
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {w.network} · {w.user_email} · {formatDate(w.created_date)}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{w.wallet_address}</p>
        </div>
      ))}
    </div>
  );
}