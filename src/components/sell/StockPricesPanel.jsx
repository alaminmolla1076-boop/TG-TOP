import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Tags } from "lucide-react";
import StockAgePriceCard from "@/components/sell/StockAgePriceCard";
import StockAgeFilters from "@/components/sell/StockAgeFilters";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";

const rowKey = (r) => `${r.country_iso}|${r.spam ? "spam" : "nonspam"}|${r.age_category ?? ""}`;

// A separate editor card for every country + age, with independent pool prices.
export default function StockPricesPanel({ stock, countries = [], onSaved }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
  const [edits, setEdits] = useState({});
  const [busyKey, setBusyKey] = useState(null);
  const [country, setCountry] = useState("");
  const [age, setAge] = useState("");

  const inputValue = (row) => {
    const k = rowKey(row);
    if (edits[k] !== undefined) return edits[k];
    return row.price != null ? String(row.price) : "";
  };

  async function save(row, raw) {
    const price = Number(String(raw).trim());
    if (!String(raw).trim() || !Number.isFinite(price) || price <= 0) {
      toast({
        title: t("s1.invalid"),
        description: t("s1.invalidDesc"),
        variant: "destructive",
      });
      return;
    }
    const key = rowKey(row);
    setBusyKey(key);
    try {
      await invoke("setStockPrice", {
        country_iso: row.country_iso,
        price,
        spam: !!row.spam,
        ...(row.age_category ? { age_category: row.age_category } : {}),
      });
      toast({
        title: t("s1.updated"),
        description: t("s1.updatedDesc", {
          country: row.country_name,
          pool: t(row.spam ? "sl.spam" : "sl.nonSpam"),
          age: row.age_category ? ageLabel(row.age_category, t) : t("ag.all"),
          price: formatMoney(price),
        }),
      });
      await onSaved?.();
      setEdits((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      toast({
        title: t("s1.updateFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyKey(null);
  }

  const byListing = new Map();
  for (const row of stock || []) {
    // A legacy pool-wide price is not an age listing and cannot overwrite one.
    if (!row.age_category) continue;
    const key = `${row.country_iso}|${row.age_category}`;
    if (!byListing.has(key)) byListing.set(key, { ...row, pools: new Map() });
    byListing.get(key).pools.set(!!row.spam, row);
  }
  const countryMap = new Map(countries.map((item) => [item.country_iso, item]));
  for (const row of stock || []) if (!countryMap.has(row.country_iso)) countryMap.set(row.country_iso, row);
  let groups = [...byListing.values()].filter((item) => !country || item.country_iso === country);
  if (country && age) {
    groups = [byListing.get(`${country}|${age}`) || {
      ...countryMap.get(country), country_iso: country, age_category: age, pools: new Map(),
    }];
  }

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
        <Tags className="h-3.5 w-3.5" strokeWidth={1.5} />
        <h2 className="leading-[1.3]">{t("s1.prices")}</h2>
      </div>
      <StockAgeFilters countries={[...countryMap.values()]} country={country} age={age}
        onCountry={(value) => { setCountry(value); setAge(""); }} onAge={setAge} />
      {stock === null ? (
        <div className="flex items-center gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
          {t("c.loading")}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex items-center gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]">
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
          {t("s1.none")}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => (
            <StockAgePriceCard
              key={`${g.country_iso}|${g.age_category}`}
              group={g}
              getValue={inputValue}
              isBusy={(r) => busyKey === rowKey(r)}
              onValue={(r, v) => setEdits((prev) => ({ ...prev, [rowKey(r)]: v }))}
              onSave={(r) => save(r, inputValue(r))}
            />
          ))}
        </div>
      )}
    </section>
  );
}