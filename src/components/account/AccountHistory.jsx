import React from "react";
import { formatDate, formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";
import { cn } from "@/lib/utils";
import CountryFlag from "@/components/CountryFlag";
import WithdrawList from "./WithdrawList";

const rowClass =
  "flex items-center gap-3 rounded-2xl border border-ring/[.2] bg-card/75 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_6px_16px_rgba(0,0,0,.22)]";

const statusTone = {
  approved: "text-emerald-400",
  completed: "text-emerald-400",
  success: "text-emerald-400",
  paid: "text-emerald-400",
  code_sent: "text-ring",
  rejected: "text-red-400",
  failed: "text-red-400",
  pending: "text-ring",
};

function Empty({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-ring/30 bg-card/50 px-3.5 py-3 text-[12.5px] text-muted-foreground">
      {children}
    </div>
  );
}

function Row({ flagIso, title, sub, extra, amount, note, noteTone }) {
  return (
    <div className={rowClass}>
      {flagIso ? <CountryFlag iso={flagIso} className="mt-0.5" /> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>
        {extra ? (
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/80">{extra}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        {amount ? (
          <p className="font-display text-[14px] font-bold tabular-nums text-primary">{amount}</p>
        ) : null}
        {note ? (
          <p className={cn("mt-0.5 text-[9.5px] font-semibold uppercase tracking-[.08em]", noteTone || "text-muted-foreground")}>
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SubHead({ children }) {
  return (
    <p className="text-[9.5px] font-semibold uppercase tracking-[.12em] text-ring/80">{children}</p>
  );
}

// Nordic Frost Glass — history panels switched from the stat buttons.
export default function AccountHistory({ tab, data }) {
  const { t } = useAppLang();
  const sales = data?.account_sales || [];
  const stockRows = (data?.my_stock || []).filter((s) => Number(s.stock) > 0);
  const deposits = data?.deposits || [];
  const withdrawals = data?.withdrawals || [];

  if (tab === "sold") {
    if (!sales.length) return <Empty>{t("ah.none")}</Empty>;
    return (
      <div className="flex flex-col gap-2">
        {sales.map((s) => {
          const state = s.reward_status || s.status;
          return (
            <Row
              key={s.id}
              flagIso={s.country_iso}
              title={s.phone_number || s.country_iso}
              sub={[s.country_iso, formatDate(s.created_date)].filter(Boolean).join(" · ")}
              amount={s.reward_amount != null ? formatMoney(s.reward_amount) : ""}
              note={state}
              noteTone={statusTone[state]}
            />
          );
        })}
      </div>
    );
  }

  if (tab === "pending") {
    if (!stockRows.length) return <Empty>{t("ah.none")}</Empty>;
    return (
      <div className="flex flex-col gap-2">
        {stockRows.map((s) => {
          const key = [s.country_iso, s.spam, s.age_category].join("|");
          return (
            <Row
              key={key}
              flagIso={s.country_iso}
              title={s.country_name || s.country_iso}
              sub={[s.age_category, s.spam ? "spam" : null].filter(Boolean).join(" · ")}
              amount={"×" + s.stock}
              note={s.price != null ? formatMoney(s.price) : ""}
              noteTone="text-ring"
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-2">
        <SubHead>{t("ah.topups")}</SubHead>
        {deposits.length ? (
          deposits.map((d) => (
            <Row
              key={d.id}
              title={formatMoney(d.amount)}
              sub={[d.network, formatDate(d.created_date)].filter(Boolean).join(" · ")}
              extra={d.txid ? String(d.txid).slice(0, 26) : ""}
              note={d.status}
              noteTone={statusTone[d.status]}
            />
          ))
        ) : (
          <Empty>{t("ah.none")}</Empty>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <SubHead>{t("ah.withdrawals")}</SubHead>
        <WithdrawList withdrawals={withdrawals} />
      </div>
    </div>
  );
}
