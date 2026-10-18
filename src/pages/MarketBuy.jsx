import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import MarketBackdrop from "@/components/market/MarketBackdrop";
import { formatMoney } from "@/lib/format";

const QUICK_QTY = [5, 10, 20, 50, 100, 500, 1000];

// Capsule List — purchase page for one seller's country. Buy 1 directly, or
// open Buy Session Formats for batch sizes 5..1000 plus a custom quantity;
// every batch passes an explicit confirmation before the purchase runs.
export default function MarketBuy() {
  const { sellerId, countryIso } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invoke, fetchMyData } = useTgIdentity();
  const [entry, setEntry] = useState(undefined); // undefined = loading, null = not found
  const [custom, setCustom] = useState("");
  const [formatsOpen, setFormatsOpen] = useState(false);
  const [pendingQty, setPendingQty] = useState(null); // quantity awaiting confirmation
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    invoke("getMarketProducts", {})
      .then((res) => {
        const seller = (res.data.sellers || []).find((s) => s.id === sellerId);
        const country = seller?.countries.find((c) => c.country_iso === countryIso);
        setEntry(seller && country ? { seller, country } : null);
      })
      .catch(() => setEntry(null));
  }, [sellerId, countryIso]);

  const stock = entry?.country?.stock || 0;
  const parsed = parseInt(custom, 10);
  const customValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= stock;

  async function buy(qty) {
    if (!entry) return;
    setBusy(true);
    try {
      const res = await invoke("buySession", {
        country_iso: entry.country.country_iso,
        quantity: qty,
        seller_email: entry.seller.email,
      });
      const bought = res.data.accounts || [];
      if (qty === 1 && bought[0]?.phone_number) {
        toast({
          title: "Account purchased",
          description: `${bought[0].phone_number} — tap Get Code on the Market page for its login code. New balance ${formatMoney(res.data.balance)}`,
        });
      } else {
        toast({
          title: "Purchase completed",
          description: `${res.data.count ?? bought.length} accounts — session formats were sent to your Telegram chat. New balance ${formatMoney(res.data.balance)}`,
        });
      }
      fetchMyData(true).catch(() => {});
      navigate("/market");
    } catch (err) {
      toast({
        title: "Purchase failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      setBusy(false);
    }
  }

  if (entry === undefined) {
    return <p className="mk-fade text-[13px] text-[#a8a3cf]">Loading…</p>;
  }
  if (entry === null) {
    return (
      <div className="mk-fade rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
        Country not found — the stock may have just sold out.
      </div>
    );
  }

  const { seller, country } = entry;
  const dial = country.dial_code
    ? ` +${String(country.dial_code).replace(/^\+/, "")}`
    : "";

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
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-xl shadow-[0_0_0_2px_#13111C,0_0_0_4px_#6C5CE7,0_0_0_8px_rgba(108,92,231,.18)]">
            {country.flag || country.country_iso}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[10px] font-semibold uppercase tracking-[.14em] text-[#A29BFE]">
              {country.country_name}
              <span className="ml-1.5 normal-case tracking-normal">{dial}</span>
               · from {seller.name}
            </div>
            <div className="mt-1 bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] bg-clip-text font-display text-[34px] font-bold leading-none text-transparent tabular-nums">
              {formatMoney(country.price)}
            </div>
            <p className="mt-1 text-[13px] text-[#a8a3cf]">{country.stock} in stock</p>
          </div>
        </div>

        {seller.is_self ? (
          <div className="mk-sec rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
            This is your own listing — you can't buy your own stock. Buyers will see this page with the purchase buttons.
          </div>
        ) : (
        <section className="mk-sec flex flex-col gap-3">
          <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#A29BFE]">Buy</div>
          <div className="flex flex-col gap-2.5 rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-3.5">
            <button
              type="button"
              disabled={busy || stock < 1}
              onClick={() => buy(1)}
              className="w-full cursor-pointer rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Buying…" : "Buy 1"}
            </button>

            <button
              type="button"
              disabled={busy || stock < 1}
              onClick={() => {
                setFormatsOpen((v) => !v);
                setPendingQty(null);
              }}
              className="w-full cursor-pointer rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.22)] px-[18px] py-3 text-[13px] font-semibold text-[#A29BFE] transition-[border-color,background-color] duration-200 hover:border-[#A29BFE]/70 hover:bg-[rgba(108,92,231,.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Session Formats
            </button>

            {formatsOpen && (
              <div className="flex flex-col gap-2.5 rounded-[22px] border border-[#A29BFE]/25 bg-[rgba(45,38,78,.6)] p-3">
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_QTY.map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={busy || n > stock}
                      onClick={() => setPendingQty(n)}
                      className="cursor-pointer rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] py-2.5 text-xs font-semibold text-foreground transition-[border-color] duration-200 hover:border-[#A29BFE]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Buy {n}
                    </button>
                  ))}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customValid) setPendingQty(parsed);
                  }}
                >
                  <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder={`Custom quantity (max ${stock})`}
                    inputMode="numeric"
                    disabled={busy}
                    className="h-[42px] min-w-0 flex-1 rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-4 text-[13px] text-foreground placeholder:text-[#a8a3cf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={busy || !customValid}
                    className="h-[42px] shrink-0 cursor-pointer rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-5 text-xs font-semibold text-[#A29BFE] transition-[border-color] duration-200 hover:border-[#A29BFE]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Buy
                  </button>
                </form>
              </div>
            )}

            {pendingQty != null && (
              <div className="flex flex-col gap-3 rounded-[22px] border border-[#A29BFE]/35 bg-[rgba(45,38,78,.85)] p-[16px]">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Confirm purchase</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#a8a3cf]">
                    {pendingQty} × {formatMoney(country.price)} ={" "}
                    <span className="font-semibold text-[#A29BFE]">{formatMoney(pendingQty * country.price)}</span>.
                    Session formats will be delivered to your Telegram chat, with 2FA removed.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => buy(pendingQty)}
                    className="flex-1 cursor-pointer rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Buying…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPendingQty(null)}
                    className="flex-1 cursor-pointer rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-[18px] py-3 text-[13px] font-semibold text-foreground transition-[border-color] duration-200 hover:border-[#A29BFE]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
        )}
      </div>
    </div>
  );
}