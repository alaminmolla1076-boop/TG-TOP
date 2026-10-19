import React, { useState } from "react";
import { Ban, History as HistoryIcon, ShieldOff } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatMoney } from "@/lib/format";
import AdminRecordList from "./AdminRecordList";
import { AdminSpinner } from "./AdminUsersTab";

const panelClass =
  "rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";
const pillBtn =
  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-[9px] text-xs font-semibold uppercase tracking-[.06em] transition-colors duration-200 disabled:opacity-50";

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

  return (
    <div className={panelClass + " flex flex-col gap-3"}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] font-display text-sm font-bold text-[#A29BFE]">
          {(user.username || user.first_name || "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">ID: {user.telegram_id}</p>
        </div>
        <span
          className={
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
            (user.banned
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/15 text-primary")
          }
        >
          {t(user.banned ? "adm.banned" : "adm.active")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("adm.balance")}:{" "}
        <span className="font-display text-base font-bold text-primary">{formatMoney(user.balance)}</span>
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={toggleBan}
          disabled={busy}
          className={
            pillBtn +
            " " +
            (user.banned
              ? "border border-ring/40 bg-ring/[.14] text-[#C9C4FF] hover:bg-ring/[.24]"
              : "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20")
          }
        >
          {user.banned ? (
            <ShieldOff className="h-[13px] w-[13px]" strokeWidth={2} />
          ) : (
            <Ban className="h-[13px] w-[13px]" strokeWidth={2} />
          )}
          {t(user.banned ? "adm.unban" : "adm.ban")}
        </button>
        <button
          type="button"
          onClick={toggleHistory}
          className={
            pillBtn +
            " border border-ring/[.25] bg-[rgba(45,38,78,.5)] text-[#a8a3cf] hover:bg-accent/90 " +
            (showHistory ? "text-foreground" : "")
          }
        >
          <HistoryIcon className="h-[13px] w-[13px]" strokeWidth={2} />
          {t("adm.tabHistory")}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("adm.amount")}
          inputMode="decimal"
          maxLength={12}
          className="w-0 flex-1 rounded-full border border-ring/[.25] bg-[rgba(45,38,78,.5)] px-4 py-[9px] text-[13px] text-foreground placeholder:text-[#a8a3cf]/60 focus:border-[#A29BFE]/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => changeBalance("add")}
          disabled={busy}
          className={pillBtn + " bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] text-white shadow-[0_4px_14px_rgba(108,92,231,.45)]"}
        >
          {t("adm.add")}
        </button>
        <button
          type="button"
          onClick={() => changeBalance("set")}
          disabled={busy}
          className={pillBtn + " border border-ring/40 bg-ring/[.14] text-[#C9C4FF] hover:bg-ring/[.24]"}
        >
          {t("adm.set")}
        </button>
      </div>

      {showHistory &&
        (history ? (
          <div className="flex flex-col gap-2.5">
            <AdminRecordList
              title={t("adm.purchases")}
              items={history.purchases}
              empty={t("adm.noHistory")}
              line={(o) => ({
                main: o.product_name || String(o.id),
                sub: o.status + " · " + formatDate(o.created_date),
                amount: formatMoney(Number(o.price)),
              })}
            />
            <AdminRecordList
              title={t("adm.sales")}
              items={history.sales}
              empty={t("adm.noHistory")}
              line={(s) => ({
                main: (s.country_iso + " " + (s.phone_number || "")).trim(),
                sub: s.status + " · " + formatDate(s.created_date),
                amount: s.reward_amount === null ? undefined : formatMoney(Number(s.reward_amount)),
              })}
            />
            <AdminRecordList
              title={t("adm.topups")}
              items={history.topups}
              empty={t("adm.noHistory")}
              line={(x) => ({
                main: x.network,
                sub: x.status + " · " + formatDate(x.created_date),
                amount: formatMoney(Number(x.amount)),
              })}
            />
            <AdminRecordList
              title={t("adm.tabWithdrawals")}
              items={history.withdrawals}
              empty={t("adm.noHistory")}
              line={(w) => ({
                main: w.network,
                sub: w.status + " · " + formatDate(w.created_date),
                amount: formatMoney(Number(w.amount)),
                negative: true,
              })}
            />
          </div>
        ) : (
          <AdminSpinner />
        ))}
    </div>
  );
}