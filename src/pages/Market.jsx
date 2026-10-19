import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import MarketBackdrop from "@/components/market/MarketBackdrop";
import TopSellerCapsule from "@/components/market/TopSellerCapsule";
import SellerList from "@/components/market/SellerList";
import SellerSearchBar from "@/components/market/SellerSearchBar";
import ProductsList from "@/components/market/ProductsList";
import HowItWorksBand from "@/components/market/HowItWorksBand";
import { formatMoney } from "@/lib/format";

// Capsule List — Market: Top Seller capsule + seller name directory; each
// seller name opens their own country-stock page, countries open the
// purchase page. Purchases, orders and products stay on this page.
export default function Market() {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [products, setProducts] = useState(null);
  const [sellers, setSellers] = useState(null);
  const [topSeller, setTopSeller] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState(null);
  const [searching, setSearching] = useState(false);

  async function load() {
    setLoadError(false);
    try {
      const catalog = await invoke("getMarketProducts", {});
      setProducts(catalog.data.products || []);
      setSellers(catalog.data.sellers || []);
      setTopSeller(catalog.data.top_seller || null);
    } catch (err) {
      setProducts([]);
      setSellers([]);
      setTopSeller(null);
      setLoadError(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function searchSellers(q) {
    setSearching(true);
    try {
      const catalog = await invoke("getMarketProducts", { query: q });
      setSellers(catalog.data.sellers || []);
      setSearchQuery(q);
    } catch (err) {
      toast({
        title: "Search failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setSearching(false);
  }

  async function clearSearch() {
    setSearchQuery(null);
    await load();
  }

  async function handleBuy(product) {
    setBuyingId(product.id);
    try {
      const res = await invoke("buyProduct", { product_id: product.id });
      toast({
        title: "Purchase completed",
        description: `${product.name} — new balance ${formatMoney(res.data.balance)}`,
      });
      load();
    } catch (err) {
      toast({
        title: "Purchase failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBuyingId(null);
  }

  return (
    <div className="relative">
      <MarketBackdrop />
      <div className="relative z-10 flex flex-col gap-[22px]">
        <span className="mk-fade self-center rounded-full border border-[#A29BFE]/35 bg-[rgba(108,92,231,.14)] px-4 py-1.5 text-[11px] font-semibold tracking-[.14em] text-[#A29BFE]">
          TRUSTED DIGITAL MARKETPLACE
        </span>
        <TopSellerCapsule topSeller={topSeller} />
        <SellerSearchBar
          onSearch={searchSellers}
          onClear={clearSearch}
          searching={searching}
          activeQuery={searchQuery}
        />
        {loadError ? (
          <div className="mk-sec flex flex-col items-center gap-3 rounded-[22px] border border-[#A29BFE]/30 bg-[rgba(45,38,78,.5)] p-[18px] text-center">
            <p className="text-[13px] text-[#a8a3cf]">
              Couldn't load the market right now. Check your connection and retry.
            </p>
            <button
              type="button"
              onClick={load}
              className="cursor-pointer rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.25)] px-5 py-2 text-[13px] font-semibold text-[#A29BFE] transition-colors duration-200 hover:bg-[rgba(108,92,231,.45)]"
            >
              Retry
            </button>
          </div>
        ) : (
          <SellerList sellers={sellers} query={searchQuery} />
        )}
        <ProductsList products={products} buyingId={buyingId} onBuy={handleBuy} />
        <HowItWorksBand />
      </div>
    </div>
  );
}