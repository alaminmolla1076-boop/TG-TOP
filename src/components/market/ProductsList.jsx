import React from "react";
import { Gem } from "lucide-react";
import SectionHead from "./SectionHead";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";

// Capsule List — Products section with gradient Buy buttons.
export default function ProductsList({ products, buyingId, onBuy }) {
  const { t } = useAppLang();
  return (
    <section className="mk-sec flex flex-col gap-3">
      <SectionHead
        icon={<Gem className="h-4 w-4" strokeWidth={1.5} />}
        title={t("mk.products")}
        badge={products?.length > 0 ? t("mk.items", { n: products.length }) : undefined}
      />
      {products === null ? (
        <p className="text-[13px] text-[#a8a3cf]">{t("c.loading")}</p>
      ) : products.length === 0 ? (
        <p className="text-[13px] text-[#a8a3cf]">{t("mk.noProducts")}</p>
      ) : (
        products.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3.5 rounded-[20px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] px-4 py-3.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-base font-bold text-[#A29BFE]">
              {p.icon || p.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-foreground">{p.name}</p>
              <p className="truncate text-[13px] text-[#a8a3cf]">
                {p.description || p.unit_label || p.category || t("mk.general")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <p className="text-[15px] font-bold text-[#A29BFE] tabular-nums">{formatMoney(p.price)}</p>
              <button
                type="button"
                onClick={() => onBuy(p)}
                disabled={buyingId === p.id}
                className="cursor-pointer rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buyingId === p.id ? t("c.buying") : t("c.buy")}
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}