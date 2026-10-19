import React from "react";

const panelClass =
  "rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";

// Shared record list used across the admin tabs: title + rows with a main
// line, an optional sub line and an optional amount.
export default function AdminRecordList({ title, items, line, empty }) {
  const rows = items || [];
  return (
    <div className={panelClass + " flex flex-col gap-2.5"}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#A29BFE]">{title}</p>
      {rows.length === 0 && (
        <p className="text-[13px] text-muted-foreground">{empty}</p>
      )}
      {rows.map((it, i) => {
        const l = line(it);
        return (
          <div key={it.id ?? i} className="flex items-center justify-between gap-2 text-[13px]">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{l.main}</p>
              {l.sub && <p className="truncate text-xs text-muted-foreground">{l.sub}</p>}
            </div>
            {l.amount !== undefined && (
              <p
                className={
                  "shrink-0 font-display text-base font-bold " +
                  (l.negative ? "text-destructive" : "text-primary")
                }
              >
                {l.amount}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}