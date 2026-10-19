import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatDate, formatMoney } from "@/lib/format";

const panelClass =
  "rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";
const approveBtn =
  "flex flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] px-2.5 py-[9px] text-xs font-semibold uppercase tracking-[.06em] text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 disabled:opacity-50";
const rejectBtn =
  "flex flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-full border border-ring/40 bg-ring/[.14] px-2.5 py-[9px] text-xs font-semibold uppercase tracking-[.06em] text-[#C9C4FF] transition-[opacity,background-color] duration-200 hover:bg-ring/[.24] active:opacity-80 disabled:opacity-50";

// Withdrawals tab — pending withdrawals with approve / reject, settled through
// the existing reviewWithdrawal function.
export default function AdminWithdrawalsTab({ pending, loading, onChanged }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
  const [busyId, setBusyId] = useState(null);

  async function review(w, action) {
    setBusyId(w.id);
    try {
      await invoke("reviewWithdrawal", { id: w.id, action });
      toast({
        title: action === "approve" ? t("wd.approvedToast") : t("wd.rejectedToast"),
        description:
          action === "approve" ? t("wd.sentDesc", { amount: formatMoney(Number(w.amount)) }) : undefined,
      });
      onChanged && onChanged();
    } catch (err) {
      toast({
        title: t("c.actionFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200/20 border-t-[#A29BFE]" />
      </div>
    );
  }

  if (!pending || pending.length === 0) {
    return (
      <div className={panelClass + " flex items-center gap-2.5"}>
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
        {t("wd.nonePending")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pending.map((w) => (
        <div key={w.id} className={panelClass + " flex flex-col gap-2 !text-foreground"}>
          <div className="flex items-center gap-2.5">
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
            <p className="flex-1 font-display text-lg font-bold text-primary">
              {formatMoney(Number(w.amount))}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {w.telegram_username ? "@" + w.telegram_username : w.user_email}
          </p>
          <p className="text-xs text-muted-foreground">
            {w.network} · {w.coin || "USDT"} · {formatDate(w.created_date)}
          </p>
          <p className="break-all font-mono text-[11px] text-muted-foreground">{w.wallet_address}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => review(w, "approve")} disabled={busyId === w.id} className={approveBtn}>
              <Check className="h-[13px] w-[13px]" strokeWidth={2} /> {t("c.approve")}
            </button>
            <button type="button" onClick={() => review(w, "reject")} disabled={busyId === w.id} className={rejectBtn}>
              <X className="h-[13px] w-[13px]" strokeWidth={2} /> {t("c.reject")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}