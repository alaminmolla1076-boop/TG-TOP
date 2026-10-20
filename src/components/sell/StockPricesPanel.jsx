import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Tags } from "lucide-react";
import StockPriceRow from "./StockPriceRow";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";

const poolKey = (row) => `${row.country_iso}|${row.spam ? "spam" : "nonspam"}`;

// Country-based price editor at the top of the Sell page: the seller sets the
// sale price for all their available numbers of a country — separately for the
// Non-Spam and the Spam pool, each pool with its own price. Nordic Frost
// Glass — frosted lozenge cards.
export default function StockPricesPanel({ stock, onSaved }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
  const [edits, setEdits] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  const inputValue = (row) => {
    const k = poolKey(row);
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
    const key = poolKey(row);
    setBusyKey(key);
    try {
      await invoke("setStockPrice", { country_iso: row.country_iso, price, spam: !!row.spam });
      toast({
        title: t("s1.updated"),
        description: t("s1.updatedDesc", {
          country: row.country_name,
          pool: t(row.spam ? "sl.spam" : "sl.nonSpam"),
          price: formatMoney(price),
        }),
      });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      onSaved && onSaved();
    } catch (err) {
      toast({
        title: t("s1.updateFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyKey(null);
  }

  // One card per country; inside it, one price editor per stock pool.
  const groups = [];
  const byIso = new Map();
  for (const row of stock || []) {
    let g = byIso.get(row.country_iso);
    if (!g) {
      g = { country_iso: row.country_iso, country_name: row.country_name, flag: row.flag, pools: [] };
      byIso.set(row.country_iso, g);
      groups.push(g);
    }
    g.pools.push(row);
  }
  // Always show BOTH pools per country (Non-Spam + Spam) — even when one pool
  // is empty, so its price can be set ahead of time for future stock.
  for (const g of groups) {
    for (const spam of [false, true]) {
      if (!g.pools.some((p) => !!p.spam === spam)) {
        g.pools.push({
          country_iso: g.country_iso,
          country_name: g.country_name,
          flag: g.flag,
          spam,
          stock: 0,
          price: null,
        });
      }
    }
  }

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
        <Tags className="h-3.5 w-3.5" strokeWidth={1.5} />
        <h2 className="leading-[1.3]">{t("s1.prices")}</h2>
        <Badge className="border border-ring/35 bg-ring/[.12] text-ring hover:bg-ring/[.12]">
          {t("s1.countryCount", { n: groups.length })}
        </Badge>
      </div>
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
            <StockPriceRow
              key={g.country_iso}
              country={g}
              pools={g.pools}
              getValue={inputValue}
              isBusy={(p) => busyKey === poolKey(p)}
              onValue={(p, v) => setEdits((prev) => ({ ...prev, [poolKey(p)]: v }))}
              onSave={(p) => save(p, inputValue(p))}
            />
          ))}
        </div>
      )}
    </section>
  );
}