import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Users } from "lucide-react";
import SectionHead from "./SectionHead";
import { useAppLang } from "@/lib/AppLanguageContext";

// Capsule List — seller name directory. Each name row navigates to the
// seller's own country-stock page (page-based, not an accordion).
export default function SellerList({ sellers, query }) {
  const { t } = useAppLang();
  return (
    <section className="mk-sec flex flex-col gap-3">
      <SectionHead
        icon={<Users className="h-4 w-4" strokeWidth={1.5} />}
        title={t("mk.sellers")}
        badge={t("mk.sellersCount", { n: sellers?.length ?? 0 })}
      />
      {sellers === null ? (
        <p className="text-[13px] text-[#a8a3cf]">{t("c.loading")}</p>
      ) : sellers.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
          {query ? t("mk.searchNone", { query }) : t("mk.noSellers")}
        </div>
      ) : (
        sellers.map((s) => (
          <Link
            key={s.id}
            to={`/market/seller/${s.id}`}
            className="flex w-full items-center gap-3 rounded-full border border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] py-2.5 pl-2.5 pr-4 text-left text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.07)] transition-[border-color,background-color] duration-200 no-underline hover:border-[#A29BFE]/60 hover:bg-[rgba(45,38,78,.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] active:opacity-85"
          >
            {s.photo_url ? (
              <img
                src={s.photo_url}
                alt={s.name}
                className="h-9 w-9 shrink-0 rounded-full border border-[#A29BFE]/40 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.18)] text-sm font-bold text-[#A29BFE]">
                {(s.name || "S")[0].toUpperCase()}
              </div>
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-medium text-foreground">{s.name}</span>
                {s.is_self && (
                  <span className="shrink-0 rounded-full bg-[rgba(108,92,231,.22)] px-[7px] py-px text-[10px] font-semibold text-[#A29BFE]">
                    {t("c.you")}
                  </span>
                )}
              </span>
              <span className="block truncate text-[11px] text-[#a8a3cf]">
                {s.username ? `@${s.username} · ` : ""}
                {t("mk.idInStock", {
                  id: s.telegram_id || s.id.slice(0, 8),
                  n: s.countries.reduce((n, c) => n + (c.stock || 0), 0),
                })}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#a8a3cf]" strokeWidth={1.5} />
          </Link>
        ))
      )}
    </section>
  );
}