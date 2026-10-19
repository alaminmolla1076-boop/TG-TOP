import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useAppLang } from "@/lib/AppLanguageContext";
import SectionHead from "@/components/market/SectionHead";
import MarketBackdrop from "@/components/market/MarketBackdrop";
import { formatMoney } from "@/lib/format";

// Stock pools: accounts are filed as Spam or Non-Spam at login (SpamBot
// verdict); the buyer picks which pool to browse.
const poolStockOf = (c, pool) =>
  pool === "spam" ? c.spam_stock ?? 0 : c.nonspam_stock ?? c.stock ?? 0;

// Capsule List — seller page: a Spam / Non-Spam stock choice, then the
// countries this seller has in that pool. Each country row opens the
// standalone purchase page.
export default function MarketSeller() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
  const [seller, setSeller] = useState(undefined); // undefined = loading, null = not found
  const [pool, setPool] = useState(
    new URLSearchParams(window.location.search).get("pool") === "spam" ? "spam" : "nonspam"
  );

  useEffect(() => {
    invoke("getMarketProducts", {})
      .then((res) => {
        setSeller((res.data.sellers || []).find((s) => s.id === sellerId) || null);
      })
      .catch(() => setSeller(null));
  }, [sellerId]);

  function choosePool(next) {
    setPool(next);
    navigate(`/market/seller/${sellerId}?pool=${next}`, { replace: true });
  }

  if (seller === undefined) {
    return <p className="mk-fade text-[13px] text-[#a8a3cf]">{t("c.loading")}</p>;
  }
  if (seller === null) {
    return (
      <div className="mk-fade rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
        {t("sl.notFound")}
      </div>
    );
  }

  const countries = (seller.countries || []).filter((c) => poolStockOf(c, pool) > 0);

  return (
    <div className="relative">
      <MarketBackdrop />
      <div className="relative z-10 flex flex-col gap-[22px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mk-fade -ml-1 flex w-fit cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[13px] font-semibold text-[#a8a3cf] transition-colors duration-200 hover:text-[#A29BFE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> {t("c.back")}
        </button>

        <div className="mk-cap flex items-center gap-3.5 rounded-[30px] border border-[#A29BFE]/30 bg-gradient-to-br from-[rgba(45,38,78,.85)] to-[rgba(33,28,56,.9)] p-5">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] shadow-[0_0_0_2px_#13111C,0_0_0_4px_#6C5CE7,0_0_0_8px_rgba(108,92,231,.18)]">
            {seller.photo_url ? (
              <img src={seller.photo_url} alt={seller.name} className="h-[52px] w-[52px] object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-[#13111C]">
                {(seller.name || "S")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-base font-semibold text-foreground">
              {seller.name}
              {seller.is_self && (
                <span className="shrink-0 rounded-full bg-[rgba(108,92,231,.22)] px-[7px] py-px text-[10px] font-semibold text-[#A29BFE]">
                  {t("c.you")}
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#a8a3cf]">
              {seller.username ? `@${seller.username} · ` : ""}ID: {seller.telegram_id || seller.id.slice(0, 8)}
            </p>
            <span className="mt-1.5 inline-block rounded-full border border-[#A29BFE]/30 bg-[rgba(108,92,231,.12)] px-[9px] py-0.5 text-[11px] font-semibold text-[#A29BFE]">
              {t("sl.soldCount", { n: seller.sold ?? 0 })}
            </span>
          </div>
        </div>

        <section className="mk-sec flex flex-col gap-3">
          <SectionHead
            icon={<Globe className="h-4 w-4" strokeWidth={1.5} />}
            title={t("sl.countryStock")}
            badge={`${countries.length} ${countries.length === 1 ? t("c.country") : t("c.countries")}`}
          />
          <div className="grid grid-cols-2 gap-2.5" role="tablist">
            {[
              { key: "nonspam", label: t("sl.nonSpam") },
              { key: "spam", label: t("sl.spam") },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={pool === p.key}
                onClick={() => pool !== p.key && choosePool(p.key)}
                className={
                  pool === p.key
                    ? "cursor-pointer rounded-full border border-[#A29BFE]/60 bg-[rgba(108,92,231,.3)] py-2.5 text-[13px] font-semibold text-[#A29BFE] shadow-[inset_0_1px_0_rgba(255,255,255,.07)]"
                    : "cursor-pointer rounded-full border border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] py-2.5 text-[13px] font-semibold text-[#a8a3cf] transition-[border-color,background-color] duration-200 hover:border-[#A29BFE]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          {countries.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
              {pool === "spam" ? t("sl.noSpamStock") : t("sl.noNonSpamStock")}
            </div>
          ) : null}
          {countries.map((c) => (
            <Link
              key={c.country_iso}
              to={`/market/buy/${seller.id}/${c.country_iso}?pool=${pool}`}
              className="flex w-full items-center gap-3 rounded-full border border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] py-2.5 pl-2.5 pr-4 text-left text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.07)] transition-[border-color,background-color] duration-200 no-underline hover:border-[#A29BFE]/60 hover:bg-[rgba(45,38,78,.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] active:opacity-85"
            >
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
                <span className="block truncate text-[11px] text-[#a8a3cf]">
                  {poolStockOf(c, pool)} {t("c.inStock")}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.22)] px-3 py-1 text-[11px] font-semibold text-[#A29BFE]">
                {t("c.buy")}
              </span>
              <span className="shrink-0 text-[15px] font-bold text-[#A29BFE] tabular-nums">
                {formatMoney(c.price)}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#a8a3cf]" strokeWidth={1.5} />
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}