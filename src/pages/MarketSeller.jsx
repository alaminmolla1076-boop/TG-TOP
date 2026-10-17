import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import SectionHead from "@/components/market/SectionHead";
import MarketBackdrop from "@/components/market/MarketBackdrop";
import { formatMoney } from "@/lib/format";

// Capsule List — seller page: the countries this seller has in stock. Each
// country row opens the standalone purchase page.
export default function MarketSeller() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { invoke } = useTgIdentity();
  const [seller, setSeller] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    invoke("getMarketProducts", {})
      .then((res) => {
        setSeller((res.data.sellers || []).find((s) => s.id === sellerId) || null);
      })
      .catch(() => setSeller(null));
  }, [sellerId]);

  if (seller === undefined) {
    return <p className="mk-fade text-[13px] text-[#a8a3cf]">Loading…</p>;
  }
  if (seller === null) {
    return (
      <div className="mk-fade rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
        Seller not found — they may be out of stock.
      </div>
    );
  }

  return (
    <div className="relative">
      <MarketBackdrop />
      <div className="relative z-10 flex flex-col gap-[22px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mk-fade -ml-1 flex w-fit cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[13px] font-semibold text-[#a8a3cf] transition-colors duration-200 hover:text-[#A29BFE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Back
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
            <p className="truncate text-base font-semibold text-foreground">{seller.name}</p>
            <p className="mt-0.5 truncate text-xs text-[#a8a3cf]">
              {seller.username ? `@${seller.username} · ` : ""}ID: {seller.telegram_id || seller.id.slice(0, 8)}
            </p>
            <span className="mt-1.5 inline-block rounded-full border border-[#A29BFE]/30 bg-[rgba(108,92,231,.12)] px-[9px] py-0.5 text-[11px] font-semibold text-[#A29BFE]">
              {seller.sold ?? 0} sold
            </span>
          </div>
        </div>

        <section className="mk-sec flex flex-col gap-3">
          <SectionHead
            icon={<Globe className="h-4 w-4" strokeWidth={1.5} />}
            title="Country Stock"
            badge={`${seller.countries.length} ${seller.countries.length === 1 ? "country" : "countries"}`}
          />
          {seller.countries.map((c) => (
            <Link
              key={c.country_iso}
              to={`/market/buy/${seller.id}/${c.country_iso}`}
              className="flex w-full items-center gap-3 rounded-full border border-[#A29BFE]/25 bg-[rgba(45,38,78,.5)] py-2.5 pl-2.5 pr-4 text-left text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.07)] transition-[border-color,background-color] duration-200 no-underline hover:border-[#A29BFE]/60 hover:bg-[rgba(45,38,78,.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] active:opacity-85"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-base font-bold text-[#A29BFE]">
                {c.flag || c.country_iso}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-foreground">{c.country_name}</span>
                <span className="block truncate text-[11px] text-[#a8a3cf]">{c.stock} in stock</span>
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