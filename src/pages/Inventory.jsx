import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StockPricesPanel from "@/components/sell/StockPricesPanel";
import NumberPricePanel from "@/components/sell/NumberPricePanel";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";

// Nordic Frost Glass — frosted status badges for account sales.
const saleStatusStyle = {
  pending: "border-ring/30 bg-ring/[.12] text-ring hover:bg-ring/[.12]",
  code_sent: "border-ring/30 bg-ring/[.12] text-ring hover:bg-ring/[.12]",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/10",
  rejected: "border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/10",
  failed: "border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/10",
};

const panelClass =
  "flex items-start gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";
const panelMuted = panelClass + " items-center";

const statusDot = {
  pending: "bg-ring shadow-[0_0_8px_#6C5CE7]",
  code_sent: "bg-ring shadow-[0_0_8px_#6C5CE7]",
  completed: "bg-emerald-400 shadow-[0_0_6px_#34d399]",
  rejected: "bg-red-400 shadow-[0_0_6px_#f87171]",
  failed: "bg-red-400 shadow-[0_0_6px_#f87171]",
};

// Inventory — the seller's stock prices, per-number prices and past sales.
// Selling itself lives on its own page, behind the Sell account button.
export default function Inventory() {
  const { fetchMyData } = useTgIdentity();
  const { t } = useAppLang();
  const [sales, setSales] = useState(null);
  const [stock, setStock] = useState(null);
  const [countries, setCountries] = useState([]);

  async function load(force = false) {
    const data = await fetchMyData(force);
    setSales(data.account_sales || []);
    setStock(data.my_stock || []);
    setCountries(data.countries || []);
  }

  useEffect(() => {
    load().catch(() => {
      setSales([]);
      setStock([]);
    });
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 pb-28 lg:grid lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="og-rise flex flex-col gap-2 lg:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.08em] text-ring">{t("inv.kicker")}</p>
            <h1 className="font-display text-[26px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
              {t("inv.title")}
            </h1>
          </div>
          <Link
            to="/sell"
            className="hidden shrink-0 items-center gap-2 rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[.08em] no-underline text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 lg:flex"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} /> {t("inv.sell")}
          </Link>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("inv.sellDesc")}</p>
      </div>

      <div className="og-rise relative z-10 flex flex-col gap-4">
        <StockPricesPanel stock={stock} countries={countries} onSaved={() => load(true)} />
      </div>

      <div className="og-rise flex flex-col gap-4 [animation-delay:.2s]">
        <NumberPricePanel key={sales ? sales.length : 0} />
      </div>

      <section className="og-rise flex flex-col gap-2.5 [animation-delay:.35s] lg:col-span-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
          <h2 className="leading-[1.3]">{t("ss.title")}</h2>
        </div>
        {sales === null ? (
          <div className={panelMuted}>
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
            {t("c.loading")}
          </div>
        ) : sales.length === 0 ? (
          <div className={panelMuted}>
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
            {t("ss.none")}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2">
            {sales.map((s) => (
              <div key={s.id} className={panelClass}>
                <span className={"mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full " + (statusDot[s.status] || statusDot.pending)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {s.country_iso} · {s.phone_number}
                    </p>
                    <Badge className={saleStatusStyle[s.status] || saleStatusStyle.pending}>{s.status}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("ss.reward", { amount: formatMoney(Number(s.reward_amount)), status: s.reward_status })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Link
        to="/sell"
        className="fixed inset-x-4 bottom-[104px] z-40 mx-auto flex max-w-md items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] px-4 py-3.5 text-[13px] font-semibold uppercase tracking-[.08em] no-underline text-primary-foreground shadow-[0_12px_28px_rgba(108,92,231,.55)] transition-opacity duration-200 hover:opacity-90 lg:hidden"
      >
        <Plus className="h-4 w-4" strokeWidth={2.4} /> {t("inv.sell")}
      </Link>
    </div>
  );
}
