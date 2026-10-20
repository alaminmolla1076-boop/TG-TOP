import React, { useState } from "react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { AGE_OPTIONS, ageLabel } from "@/lib/accountAge";
import StockPoolPrice from "./StockPoolPrice";
import GlassSelect from "@/components/ui/GlassSelect";
import StockAgeList from "@/components/sell/StockAgeList";

const tabClass = (active, spam) =>
  `flex-1 cursor-pointer rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[.08em] transition-colors duration-200 ${
    active
      ? spam
        ? "border-red-400/60 bg-red-400/15 text-red-200"
        : "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
      : "border-ring/20 bg-secondary/60 text-muted-foreground hover:text-foreground"
  }`;

const ageOrder = (v) => {
  const i = AGE_OPTIONS.findIndex((o) => o.value === String(v));
  return i < 0 ? AGE_OPTIONS.length : i;
};

// One country card — flag + name + pool tabs on top, a per-age overview strip
// (each bucket with its live price and stock, tap to edit), then the account
// -age GlassSelect and the price editor for the selected pool + age bucket
// ('' = all ages at once). Nordic Frost Glass.
export default function StockPriceRow({ country, pools, getValue, isBusy, onValue, onSave }) {
  const { t } = useAppLang();
  const [activeSpam, setActiveSpam] = useState(false);
  // Non-Spam pool first, Spam pool second.
  const ordered = [...pools].filter(Boolean).sort((a, b) => Number(!!a.spam) - Number(!!b.spam));
  // Default the editor to the first age bucket that actually holds stock —
  // never leave it parked on an empty bucket.
  const stockedAgeOf = (p) =>
    p
      ? [...p.rows.values()]
          .filter((r) => r.age_category && (Number(r.stock) || 0) > 0)
          .sort((a, b) => ageOrder(a.age_category) - ageOrder(b.age_category))[0]?.age_category
      : undefined;
  const [agesByPool, setAgesByPool] = useState({});
  const active = ordered.find((p) => !!p.spam === activeSpam) || ordered[0];
  const poolKey = active?.spam ? "spam" : "nonspam";
  const age = agesByPool[poolKey] ?? stockedAgeOf(active) ?? "regular";
  const setAge = (value) => setAgesByPool((prev) => ({ ...prev, [poolKey]: value }));

  const totalOf = (p) => (p ? [...p.rows.values()].reduce((n, r) => n + (Number(r.stock) || 0), 0) : 0);

  // The editable row for the selected age bucket: the real per-age row when it
  // exists, else a synthetic one that inherits the pool-wide remembered price.
  const buildRow = (p, ageVal) => {
    if (!p) return null;
    const exact = p.rows.get(ageVal);
    if (exact) return exact;
    const base = p.rows.get("") || {};
    return {
      country_iso: p.country_iso,
      country_name: p.country_name,
      flag: p.flag,
      spam: p.spam,
      age_category: ageVal || "",
      stock: 0,
      price: base.price != null ? base.price : null,
    };
  };

  const row = buildRow(active, age);

  // Every age bucket that actually holds stock in the active pool — the
  // seller sees each bucket's live price and count at a glance.
  const ageStock = active
    ? [...active.rows.values()]
        .filter((r) => r.age_category && (Number(r.stock) || 0) > 0)
        .sort((a, b) => ageOrder(a.age_category) - ageOrder(b.age_category))
    : [];

  return (
    <div className="rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ring/25 bg-secondary/80 text-lg">
          {country.flag || country.country_iso}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{country.country_name}</p>
          <p className="text-[11px] text-muted-foreground">{t("s1.stockBuyers", { n: totalOf(active) })}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {ordered.map((p) => (
          <button
            key={p.spam ? "spam" : "nonspam"}
            type="button"
            className={tabClass(!!p.spam === activeSpam, !!p.spam)}
            onClick={() => setActiveSpam(!!p.spam)}
          >
            {t(p.spam ? "sl.spam" : "sl.nonSpam")} · {totalOf(p)}
          </button>
        ))}
      </div>
      {active && (
        <>
          <StockAgeList rows={ageStock} active={age} onChange={setAge} />
          <div className="mt-2.5 flex items-center gap-2 rounded-2xl border border-ring/[.14] bg-secondary/45 px-3.5 py-2.5">
            <label
              htmlFor={`age-${active.country_iso}-${active.spam ? "spam" : "nonspam"}`}
              className="shrink-0 text-[11px] font-semibold text-foreground"
            >
              {t("sd.age")}
            </label>
            <GlassSelect
              id={`age-${active.country_iso}-${active.spam ? "spam" : "nonspam"}`}
              value={age}
              onChange={setAge}
              options={[{ value: "", label: t("ag.all") }, ...AGE_OPTIONS.map((o) => ({ value: o.value, label: `${ageLabel(o.value, t)} · ${Number(active.rows.get(o.value)?.stock || 0)}` }))]}
              className="min-w-0 flex-1"
              triggerClass="h-9 rounded-full px-3.5 text-[13px]"
            />
          </div>
          {row && (
            <div className="mt-2.5">
              <StockPoolPrice
                pool={row}
                age={row.age_category ? ageLabel(row.age_category, t) : null}
                value={getValue(row)}
                busy={isBusy(row)}
                onValue={(v) => onValue(row, v)}
                onSave={() => onSave(row)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}