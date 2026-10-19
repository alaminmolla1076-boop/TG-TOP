import React, { useState } from "react";
import { Ban, History as HistoryIcon, ShieldOff } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatMoney } from "@/lib/format";
import AdminRecordList from "./AdminRecordList";
import { AdminSpinner } from "./AdminUsersTab";

// One user in the admin list: ban / unban, balance add / set, and an
// expandable per-user purchase / sale / top-up / withdrawal history.
export default function AdminUserRow({ user, onChanged }) {
  const { t } = useAppLang();
  const { invoke } = useTgIdentity();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(null);

  const displayName = user.username ? "@" + user.username : user.first_name || user.email;

  async function toggleBan() {
    setBusy(true);
    try {
      await invoke("adminUserAction", { email: user.email, action: user.banned ? "unban" : "ban" });
      toast({ title: user.banned ? t("adm.unban") : t("adm.ban"), description: displayName });
      onChanged && onChanged();
    } catch (err) {
      toast({
        title: t("c.actionFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function changeBalance(mode) {
    const value = Number(amount);
    if (!Number.isFinite(value)) {
      toast({ title: t("adm.amount"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        email: user.email,
        action: mode === "set" ? "set_balance" : "add_balance",
        amount: value,
        target_balance: value,
      };
      const res = await invoke("adminUserAction", payload);
      toast({ title: t("adm.newBalance"), description: formatMoney(res.data?.balance ?? 0) });
      setAmount("");
      onChanged && onChanged();
    } catch (err) {
      toast({
        title: t("c.actionFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleHistory() {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setShowHistory(true);
    if (history) return;
    try {
      const res = await invoke("adminUserHistory", { email: user.email });
      setHistory(res.data);
    } catch {
      setHistory({ purchases: [], sales: [], topups: [], withdrawals: [] });
    }
  }

  const sections = history
    ? [
        {
          title: t("adm.purchases"),
          items: history.purchases,
          line: (o) => ({
            main: o.product_name || String(o.id),
            sub: o.status + " · " + formatDate(o.created_date),
            amount: formatMoney(Number(o.price)),
          }),
        },
        {
          title: t("adm.sales"),
          items: history.sales,
          line: (s) => ({
            main: (s.country_iso + " " + (s.phone_number || "")).trim(),
            sub: s.status + " · " + formatDate(s.created_date),
            amount: s.reward_amount === null ? undefined : formatMoney(Number(s.reward_amount)),
          }),
        },
        {
          title: t("adm.topups"),
          items: history.topups,
          line: (x) => ({
            main: x.network,
            sub: x.status + " · " + formatDate(x.created_date),
            amount: formatMoney(Number(x.amount)),
          }),
        },
        {
          title: t("adm.tabWithdrawals"),
          items: history.withdrawals,
          line: (w) => ({
            main: w.network,
            sub: w.status + " · " + formatDate(w.created_date),
            amount: formatMoney(Number(w.amount)),
            negative: true,
          }),
        },
      ].filter((s) => (s.items || []).length > 0)
    : [];

  return (
    <div className="adm-card">
      <div className="adm-row">
        <span className="adm-av">
          {(user.username || user.first_name || "?").charAt(0).toUpperCase()}
        </span>
        <div className="adm-nm">
          <p className="a">{displayName}</p>
          <p className="b">ID: {user.telegram_id}</p>
        </div>
        <span className={"adm-st " + (user.banned ? "ban" : "act")}>
          {t(user.banned ? "adm.banned" : "adm.active")}
        </span>
      </div>

      <p className="adm-bal">
        {t("adm.balance")}: <b>{formatMoney(user.balance)}</b>
      </p>

      <div className="adm-btns">
        <button
          type="button"
          onClick={toggleBan}
          disabled={busy}
          className={"adm-btn" + (user.banned ? "" : " d")}
        >
          {user.banned ? (
            <ShieldOff className="h-[13px] w-[13px]" strokeWidth={2} />
          ) : (
            <Ban className="h-[13px] w-[13px]" strokeWidth={2} />
          )}
          {t(user.banned ? "adm.unban" : "adm.ban")}
        </button>
        <button type="button" onClick={toggleHistory} className="adm-btn">
          <HistoryIcon className="h-[13px] w-[13px]" strokeWidth={2} />
          {t("adm.tabHistory")}
        </button>
      </div>

      <div className="adm-btns">
        <input
          className="adm-amt"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("adm.amount")}
          inputMode="decimal"
          maxLength={12}
        />
        <button
          type="button"
          onClick={() => changeBalance("add")}
          disabled={busy}
          className="adm-btn p"
          style={{ flex: "none" }}
        >
          {t("adm.add")}
        </button>
        <button
          type="button"
          onClick={() => changeBalance("set")}
          disabled={busy}
          className="adm-btn"
          style={{ flex: "none" }}
        >
          {t("adm.set")}
        </button>
      </div>

      {showHistory &&
        (!history ? (
          <AdminSpinner />
        ) : sections.length > 0 ? (
          sections.map((s) => (
            <AdminRecordList key={s.title} title={s.title} items={s.items} line={s.line} />
          ))
        ) : (
          <p className="adm-emp">{t("adm.noHistory")}</p>
        ))}
    </div>
  );
}