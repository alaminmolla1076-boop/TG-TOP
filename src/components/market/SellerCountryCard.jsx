import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";
import { formatMoney } from "@/lib/format";

// One country card on the seller's page: the capsule opens the purchase page
// with the chosen pool, and under it the per-age price chips for that pool —
// each chip shows the exact price the buyer pays for that account age and
// also opens the purchase page. Nordic Frost Glass.
export default function SellerCountryCard({ sellerId, country, pool, age }) {
  const { t } = useAppLang();
  const buyUrl = `/market/buy/${sellerId}/${country.country_iso}?pool=${pool}${age ? `&age=${encodeURIComponent(age)}` : ""}`;
  const poolStock = pool === "spam" ? country.spam_stock ?? 0 : country.nonspam_stock ?? country.stock ?? 0;
  const ages = (country.ages || [])
    .map((a) => ({
      ...a,
      stock: pool === "spam" ? a.spam_stock : a.nonspam_stock,
      price: pool === "spam" ? a.spam_price ?? a.price : a.nonspam_price ?? a.price,
    }))
    .filter((a) => Number(a.stock) > 0 && a.price != null && (!age || String(a.category) === String(age)));
  const shownStock = age ? ages.reduce((total, a) => total + Number(a.stock), 0) : poolStock;
  const fromPrice = ages.length ? Math.min(...ages.map((a) => Number(a.price))) : country.price;

  return (
    <div className="flex flex-col gap-2 rounded-[26px] border border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]">
      <Link
        to={buyUrl}
        className="flex w-full items-center gap-3 rounded-full border border-[#A29BFE]/25 bg-[rgba(20,16,43,.45)] py-2.5 pl-2.5 pr-4 text-left text-foreground no-underline transition-[border-color,background-color] duration-200 hover:border-[#A29BFE]/60 hover:bg-[rgba(45,38,78,.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] active:opacity-85"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-base font-bold text-[#A29BFE]">
          {country.flag || country.country_iso}
        </div>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium text-foreground">
            {country.country_name}
            {country.dial_code ? (
              <span className="ml-1.5 text-[12px] font-semibold text-[#A29BFE]">
                +{String(country.dial_code).replace(/^\+/, "")}
              </span>
            ) : null}
          </span>
          <span className="block truncate text-[11px] text-[#a8a3cf]">
            {shownStock} {t("c.inStock")}
          </span>
        </span>
        <span
          title={t("c.buy")}
          aria-label={t("c.buy")}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#A29BFE]/45 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] text-[#fff] shadow-[0_4px_14px_rgba(108,92,231,.5)] transition-transform duration-200 hover:scale-105"
        >
          <ShoppingCart className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="shrink-0 text-[15px] font-bold text-[#A29BFE] tabular-nums">
          {ages.length ? t("sl.fromPrice", { price: formatMoney(fromPrice) }) : formatMoney(country.price)}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#a8a3cf]" strokeWidth={1.5} />
      </Link>
      {ages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1 pb-1">
          {ages.map((a) => (
            <Link
              key={a.category}
              to={`/market/buy/${sellerId}/${country.country_iso}?pool=${pool}&age=${encodeURIComponent(a.category)}`}
              className="flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border border-[#A29BFE]/25 bg-[rgba(20,16,43,.45)] px-3 py-1.5 no-underline transition-[border-color,background-color] duration-200 hover:border-[#A29BFE]/60 hover:bg-[rgba(108,92,231,.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
            >
              <span className="text-[10px] font-bold uppercase tracking-[.06em] text-[#a8a3cf]">
                {ageLabel(a.category, t)}
              </span>
              <span className="bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] bg-clip-text font-display text-[13px] font-bold text-transparent tabular-nums">
                {formatMoney(a.price)}
              </span>
              <span className="text-[10px] text-[#a8a3cf]">{t("sl.ageCount", { n: a.stock })}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}