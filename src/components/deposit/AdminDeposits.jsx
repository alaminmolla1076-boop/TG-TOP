import React, { useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";

export default function AdminDeposits({ pending, onChanged }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [busyId, setBusyId] = useState(null);

  async function review(d, action) {
    setBusyId(d.id);
    try {
      await invoke("reviewTopUp", { id: d.id, action });
      toast({
        title: action === "approve" ? "Deposit approved" : "Deposit rejected",
        description: action === "approve" ? `${formatMoney(Number(d.amount))} credited to balance.` : undefined,
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

  if (!pending || pending.length === 0) return <p className="text-sm text-muted-foreground">No pending deposits.</p>;

  return (
    <div className="space-y-3">
      {pending.map((d) => (
        <div key={d.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading font-semibold text-primary">{formatMoney(Number(d.amount))}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => review(d, "approve")} disabled={busyId === d.id}>
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => review(d, "reject")} disabled={busyId === d.id}>
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {d.network || "—"} · {d.user_email} · {formatDate(d.created_date)}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{d.tx_hash}</p>
        </div>
      ))}
    </div>
  );
}