import React from "react";

// A titled record list (adm-lst) used inside glass cards: rows with a main
// line, an optional sub line and an optional amount.
export default function AdminRecordList({ title, items, line, empty }) {
  const rows = items || [];
  return (
    <div className="adm-lst">
      <p className="adm-lt">{title}</p>
      {rows.length === 0
        ? empty && <p className="adm-emp">{empty}</p>
        : rows.map((it, i) => {
            const l = line(it);
            return (
              <div key={it.id ?? i} className="adm-li">
                <div>
                  <p className="m">{l.main}</p>
                  {l.sub && <p className="s">{l.sub}</p>}
                </div>
                {l.amount !== undefined && (
                  <span className={"v" + (l.negative ? " n" : "")}>{l.amount}</span>
                )}
              </div>
            );
          })}
    </div>
  );
}