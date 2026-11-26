import React from "react";
import { Gem, RotateCw, ShoppingBag } from "lucide-react";
import SectionHead from "./SectionHead";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market — product cards with a glowing icon plate and a gold Buy button.
export default function ProductsList({ products, buyingId, onBuy, onRefresh }) {
  const { t } = useAppLang();
  return (
    <section id="mk-products" className="mk-sec flex scroll-mt-24 flex-col gap-3">
      <SectionHead
        icon={<Gem className="h-4 w-4" strokeWidth={1.6} />}
        title={t("mk.products")}
        badge={products?.length > 0 ? t("mk.items", { n: products.length }) : undefined}
      />
      {products === null ? (
        <p className="text-[13px] text-[#8B93A7]">{t("c.loading")}</p>
      ) : products.length === 0 ? (
        <div className="relative overflow-hidden rounded-[24px] border border-white/[.07] bg-[linear-gradient(140deg,#07090d,#0b1119)] p-3.5">
          <span aria-hidden className="pointer-events-none absolute -left-14 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(77,139,255,.34),transparent_70%)]" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[20px] border border-[#4D8BFF]/30 bg-[rgba(45,111,253,.10)] shadow-[0_0_30px_-6px_rgba(77,139,255,.75)]">
              <ShoppingBag className="h-8 w-8 text-[#6FA8FF]" strokeWidth={1.5} />
            </span>
            <p className="flex-1 text-[11.5px] font-medium leading-relaxed text-[#9AA3B5]">{t("mk.noProducts")}</p>
          </div>
          <div className="relative mt-3 flex justify-end">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#4D8BFF]/35 bg-[rgba(45,111,253,.12)] px-3.5 py-1.5 text-[11px] font-semibold text-[#A8C8FF] transition-colors duration-200 hover:border-[#4D8BFF]/60 hover:bg-[rgba(45,111,253,.22)] active:scale-[.98]"
            >
              <RotateCw className="h-3 w-3 shrink-0" strokeWidth={2.6} />
              {t("c.retry")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-[24px] border border-[#6FA8FF]/30 bg-[linear-gradient(160deg,rgba(60,48,110,.8),rgba(28,24,46,.92))] shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_16px_34px_-22px_rgba(108,92,231,.9)]"
            >
              <div className="relative flex h-[112px] items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(162,155,254,.4),rgba(19,17,28,0)_70%)]">
                <span className="text-[44px] leading-none drop-shadow-[0_10px_22px_rgba(108,92,231,.7)]">
                  {p.icon || (p.name || "P")[0]}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 px-4 pb-4 pt-1">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold text-white">{p.name}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-[#8B93A7]">
                    {p.description || p.unit_label || p.category || t("mk.general")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#F5C451]/40 bg-[rgba(245,196,81,.12)] px-2.5 py-1 font-display text-[14px] font-bold tabular-nums text-[#F5C451]">
                    {formatMoney(p.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onBuy(p)}
                    disabled={buyingId === p.id}
                    className="cursor-pointer rounded-full bg-[linear-gradient(135deg,#FFE29A,#F5C451_45%,#D79A2B)] px-5 py-2 text-[12.5px] font-bold text-[#241505] shadow-[0_10px_22px_-10px_rgba(245,196,81,.95)] transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5C451] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buyingId === p.id ? t("c.buying") : t("c.buy")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
