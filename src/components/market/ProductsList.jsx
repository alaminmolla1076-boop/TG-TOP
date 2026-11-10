import React from "react";
import { Gem } from "lucide-react";
import SectionHead from "./SectionHead";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";

// Market — product cards with a glowing icon plate and a gold Buy button.
export default function ProductsList({ products, buyingId, onBuy }) {
  const { t } = useAppLang();
  return (
    <section className="mk-sec flex flex-col gap-3">
      <SectionHead
        icon={<Gem className="h-4 w-4" strokeWidth={1.6} />}
        title={t("mk.products")}
        badge={products?.length > 0 ? t("mk.items", { n: products.length }) : undefined}
      />
      {products === null ? (
        <p className="text-[13px] text-[#a8a3cf]">{t("c.loading")}</p>
      ) : products.length === 0 ? (
        <p className="text-[13px] text-[#a8a3cf]">{t("mk.noProducts")}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-[24px] border border-[#A29BFE]/30 bg-[linear-gradient(160deg,rgba(60,48,110,.8),rgba(28,24,46,.92))] shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_16px_34px_-22px_rgba(108,92,231,.9)]"
            >
              <div className="relative flex h-[112px] items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(162,155,254,.4),rgba(19,17,28,0)_70%)]">
                <span className="text-[44px] leading-none drop-shadow-[0_10px_22px_rgba(108,92,231,.7)]">
                  {p.icon || (p.name || "P")[0]}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 px-4 pb-4 pt-1">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold text-white">{p.name}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-[#a8a3cf]">
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
