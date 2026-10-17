import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import MarketBackdrop from "@/components/market/MarketBackdrop";
import TopSellerCapsule from "@/components/market/TopSellerCapsule";
import SellerList from "@/components/market/SellerList";
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

  async function load() {
    const catalog = await invoke("getMarketProducts", {});
    setProducts(catalog.data.products || []);
    setSellers(catalog.data.sellers || []);
    setTopSeller(catalog.data.top_seller || null);
  }

  useEffect(() => {
    load().catch(() => {
      setProducts([]);
      setSellers([]);
    });
  }, []);

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
        <SellerList sellers={sellers} />
        <ProductsList products={products} buyingId={buyingId} onBuy={handleBuy} />
        <HowItWorksBand />
      </div>
    </div>
  );
}