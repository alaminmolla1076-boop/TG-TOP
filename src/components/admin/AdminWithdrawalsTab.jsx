import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatDate, formatMoney } from "@/lib/format";
import { AdminSpinner } from "./AdminUsersTab";

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

  return (
    <div className="flex flex-col gap-4">
      <p className="adm-sec">{t("adm.tabWithdrawals")}</p>
      {loading ? (
        <AdminSpinner />
      ) : !pending || pending.length === 0 ? (
        <div className="adm-card">
          <div className="adm-row">
            <span className="adm-dot" />
            <p className="adm-emp">{t("wd.nonePending")}</p>
          </div>
        </div>
      ) : (
        pending.map((w) => (
          <div key={w.id} className="adm-card">
            <div className="adm-row">
              <span className="adm-dot" />
              <p className="adm-amv">{formatMoney(Number(w.amount))}</p>
            </div>
            <p className="adm-mut">{w.telegram_username ? "@" + w.telegram_username : w.user_email}</p>
            <p className="adm-mut">
              {w.network} · {w.coin || "USDT"} · {formatDate(w.created_date)}
            </p>
            <p className="adm-mono">{w.wallet_address}</p>
            <div className="adm-btns">
              <button
                type="button"
                onClick={() => review(w, "approve")}
                disabled={busyId === w.id}
                className="adm-btn p"
              >
                <Check className="h-[13px] w-[13px]" strokeWidth={2} /> {t("c.approve")}
              </button>
              <button
                type="button"
                onClick={() => review(w, "reject")}
                disabled={busyId === w.id}
                className="adm-btn"
              >
                <X className="h-[13px] w-[13px]" strokeWidth={2} /> {t("c.reject")}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}