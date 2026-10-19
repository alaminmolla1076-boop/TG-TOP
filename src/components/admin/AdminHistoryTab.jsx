import React from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatDate, formatMoney } from "@/lib/format";
import AdminRecordList from "./AdminRecordList";

// History tab — global purchase / sale / top-up / withdrawal feeds.
export default function AdminHistoryTab({ data, loading }) {
  const { t } = useAppLang();

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200/20 border-t-[#A29BFE]" />
      </div>
    );
  }

  const who = (x) => (x.telegram_username ? "@" + x.telegram_username : x.user_email);

  return (
    <div className="flex flex-col gap-3">
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
  );
}