import React from "react";
import { Link } from "react-router-dom";
import { Globe, ShoppingCart } from "lucide-react";
import SectionHead from "./SectionHead";
import { useAppLang } from "@/lib/AppLanguageContext";
import { formatMoney } from "@/lib/format";
import { ageCountryCatalog } from "@/lib/marketAges";

const poolTagClass = (spam) =>
  `shrink-0 rounded-full px-2 py-px text-[10px] font-bold ${
    spam ? "bg-[rgba(224,70,70,.16)] text-[#ff8a8a]" : "bg-[rgba(62,204,132,.14)] text-[#7ee2a8]"
  }`;

// Capsule List Market — the per-country catalog for the selected account age:
// each country capsule shows its total stock and best price, and lists every
// seller offer (name, pool, stock, exact price) linking straight to the
// purchase page for that pool. Nordic Frost Glass.
export default function AgeCountryList({ sellers, category }) {
  const { t } = useAppLang();
  const countries = ageCountryCatalog(sellers, category);
  const totalStock = countries.reduce((n, c) => n + c.total, 0);

  return (
    <section className="mk-sec flex flex-col gap-3">
      <SectionHead
        icon={<Globe className="h-4 w-4" strokeWidth={1.5} />}
        title={t("sl.countryStock")}
        badge={t("sl.ageCount", { n: totalStock })}
      />
      {countries.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
          {t("mk.ageNoStock")}
        </div>
      ) : (
        countries.map((c) => (
          <div
            key={c.country_iso}
            className="flex flex-col gap-2 rounded-[26px] border border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]"
          >
            <div className="flex items-center gap-3 rounded-full border border-[#A29BFE]/25 bg-[rgba(20,16,43,.45)] py-2.5 pl-2.5 pr-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-base font-bold text-[#A29BFE]">
                {c.flag || c.country_iso}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-foreground">
                  {c.country_name}
                  {c.dial_code ? (
                    <span className="ml-1.5 text-[12px] font-semibold text-[#A29BFE]">
                      +{String(c.dial_code).replace(/^\+/, "")}
                    </span>
                  ) : null}
                </span>
                <span className="block text-[11px] text-[#a8a3cf]">
                  {t("sl.ageCount", { n: c.total })}
                </span>
              </span>
              <span className="shrink-0 text-[15px] font-bold text-[#A29BFE] tabular-nums">
                {t("sl.fromPrice", { price: formatMoney(c.fromPrice) })}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-1 pb-1">
              {c.offers.map((o, i) => {
                const buyUrl = `/market/buy/${o.seller.id}/${c.country_iso}?pool=${o.pool}`;
                return (
                  <Link
                    key={`${o.seller.id}-${o.pool}-${i}`}
                    to={buyUrl}
                    className="flex w-full items-center gap-2.5 rounded-2xl border border-[#A29BFE]/20 bg-[rgba(20,16,43,.45)] px-2.5 py-2 text-left no-underline transition-[border-color,background-color] duration-200 hover:border-[#A29BFE]/60 hover:bg-[rgba(108,92,231,.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
                  >
                    {o.seller.photo_url ? (
                      <img
                        src={o.seller.photo_url}
                        alt={o.seller.name}
                        className="h-7 w-7 shrink-0 rounded-full border border-[#A29BFE]/40 object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.18)] text-[11px] font-bold text-[#A29BFE]">
                        {(o.seller.name || "S")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {o.seller.name}
                        {o.seller.is_self && (
                          <span className="ml-1.5 rounded-full bg-[rgba(108,92,231,.22)] px-[6px] py-px text-[9px] font-semibold text-[#A29BFE]">
                            {t("c.you")}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className={poolTagClass(o.pool === "spam")}>
                          {t(o.pool === "spam" ? "sl.spam" : "sl.nonSpam")}
                        </span>
                        <span className="text-[10px] text-[#a8a3cf]">{t("sl.ageCount", { n: o.stock })}</span>
                      </span>
                    </span>
                    <span className="bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] bg-clip-text font-display text-[14px] font-bold text-transparent tabular-nums">
                      {formatMoney(o.price)}
                    </span>
                    <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-[#a8a3cf]" strokeWidth={1.5} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
}