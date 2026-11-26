import React from "react";
import { ShoppingBag } from "lucide-react";
import SectionHead from "./SectionHead";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";

// Capsule List — My Orders section.
export default function OrdersList({ orders }) {
  const { t } = useAppLang();
  return (
    <section className="mk-sec flex flex-col gap-3">
      <SectionHead icon={<ShoppingBag className="h-4 w-4" strokeWidth={1.5} />} title={t("or.mine")} />
      {orders.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#6FA8FF]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#8B93A7]">
          {t("or.none")}
        </div>
      ) : (
        orders.map((o) => (
          <div
            key={o.id}
            className="flex items-center gap-3.5 rounded-[20px] border border-[#6FA8FF]/[.22] bg-[rgba(45,38,78,.5)] px-4 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-foreground">{o.product_name}</p>
              <p className="text-[13px] capitalize text-[#8B93A7]">{o.status}</p>
            </div>
            <p className="shrink-0 text-[15px] font-bold text-[#6FA8FF] tabular-nums">{formatMoney(o.price)}</p>
          </div>
        ))
      )}
    </section>
  );
}