import React, { useEffect, useState } from "react";
import { Gem } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { useAppLang } from "@/lib/AppLanguageContext";
import MarketBackdrop from "@/components/market/MarketBackdrop";
import TopSellerCapsule from "@/components/market/TopSellerCapsule";
import TopHolderCapsule from "@/components/market/TopHolderCapsule";
import SellerList from "@/components/market/SellerList";
import SellerSearchBar from "@/components/market/SellerSearchBar";
import ProductsList from "@/components/market/ProductsList";
import HowItWorksBand from "@/components/market/HowItWorksBand";
import LegalFooter from "@/components/market/LegalFooter";
import { formatMoney } from "@/lib/format";

// Capsule List — Market: Top Seller capsule + seller name directory; each
// seller name opens their own country-stock page, countries open the
// purchase page. Purchases, orders and products stay on this page.
// On desktop the seller directory and the products sit side by side.
export default function Market() {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
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
        title: t("mk.searchFailed"),
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
        title: t("mk.purchaseDone"),
        description: t("mk.purchaseDoneDesc", { name: product.name, balance: formatMoney(res.data.balance) }),
      });
      load();
    } catch (err) {
      toast({
        title: t("mk.purchaseFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBuyingId(null);
  }

  const topSellerCard = topSeller
    ? (sellers || []).find((s) => s.id === topSeller.id) || topSeller
    : null;

  const topHolder = (sellers || []).reduce((best, s) => {
    const stock = (s.countries || []).reduce((n, c) => n + (c.stock || 0), 0);
    return !best || stock > best.stock ? { ...s, stock } : best;
  }, null);

  return (
    <div className="relative">
      <MarketBackdrop />
      <div className="relative z-10 flex flex-col gap-[22px] lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-7">
        <span className="mk-fade hidden self-center items-center gap-1.5 lg:inline-flex rounded-full border border-white/10 bg-[linear-gradient(120deg,rgba(45,111,253,.16),rgba(245,196,81,.08))] px-4 py-1.5 text-[10.5px] font-semibold uppercase tracking-[.14em] text-[#A8C8FF] shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_12px_26px_-22px_rgba(0,0,0,.9)] lg:col-span-2">
          <Gem className="h-3 w-3 shrink-0 text-[#6FA8FF]" strokeWidth={2} />
          {t("mk.badge")}
        </span>
        <div className="grid grid-cols-2 gap-2 lg:col-span-2">
          <TopSellerCapsule topSeller={topSellerCard} />
          <TopHolderCapsule holder={topHolder} />
        </div>
        <div className="lg:col-span-2">
          <SellerSearchBar
            onSearch={searchSellers}
            onClear={clearSearch}
            searching={searching}
            activeQuery={searchQuery}
          />
        </div>
        {loadError ? (
          <div className="mk-sec flex flex-col items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-[18px] text-center lg:col-span-2">
            <p className="text-[13px] text-[#8B93A7]">{t("mk.loadError")}</p>
            <button
              type="button"
              onClick={load}
              className="cursor-pointer rounded-full border border-[#F5C451]/30 bg-[rgba(245,196,81,.08)] px-5 py-2 text-[#F5C451] text-[13px] font-semibold text-[#6FA8FF] transition-colors duration-200 hover:bg-[rgba(245,196,81,.16)]"
            >
              {t("c.retry")}
            </button>
          </div>
        ) : (
          <SellerList sellers={sellers} query={searchQuery} />
        )}
        <ProductsList products={products} buyingId={buyingId} onBuy={handleBuy} />
        <div className="lg:col-span-2">
          <HowItWorksBand />
        </div>
        <div className="lg:col-span-2">
          <LegalFooter />
        </div>
      </div>
    </div>
  );
}
