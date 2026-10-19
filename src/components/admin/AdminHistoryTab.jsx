import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatDate, formatMoney } from "@/lib/format";
import AdminRecordList from "./AdminRecordList";
import { AdminSpinner } from "./AdminUsersTab";

// History tab — global purchase / sale / top-up / withdrawal feeds in one
// glass card.
export default function AdminHistoryTab({ data, loading }) {
  const { t } = useAppLang();

  const who = (x) => (x.telegram_username ? "@" + x.telegram_username : x.user_email);

  return (
    <div className="flex flex-col gap-4">
      <p className="adm-sec">{t("adm.tabHistory")}</p>
      {loading ? (
        <AdminSpinner />
      ) : (
        <div className="adm-card">
          <AdminRecordList
            title={t("adm.purchases")}
            items={data?.purchases}
            empty={t("adm.empty")}
            line={(o) => ({
              main: who(o) + " · " + (o.product_name || o.id),
              sub: o.status + " · " + formatDate(o.created_date),
              amount: formatMoney(Number(o.price)),
            })}
          />
          <AdminRecordList
            title={t("adm.sales")}
            items={data?.sales}
            empty={t("adm.empty")}
            line={(s) => ({
              main: who(s) + " · " + s.country_iso,
              sub: (s.phone_number || "") + " · " + s.status + " · " + formatDate(s.created_date),
              amount: s.reward_amount === null ? undefined : formatMoney(Number(s.reward_amount)),
            })}
          />
          <AdminRecordList
            title={t("adm.topups")}
            items={data?.topups}
            empty={t("adm.empty")}
            line={(x) => ({
              main: who(x) + " · " + x.network,
              sub: x.status + " · " + formatDate(x.created_date),
              amount: formatMoney(Number(x.amount)),
            })}
          />
          <AdminRecordList
            title={t("adm.tabWithdrawals")}
            items={data?.withdrawals}
            empty={t("adm.empty")}
            line={(w) => ({
              main: who(w) + " · " + w.network,
              sub: w.status + " · " + formatDate(w.created_date),
              amount: formatMoney(Number(w.amount)),
              negative: true,
            })}
          />
        </div>
      )}
    </div>
  );
}