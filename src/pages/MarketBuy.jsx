import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { useAppLang } from "@/lib/AppLanguageContext";
import MarketBackdrop from "@/components/market/MarketBackdrop";
import PurchaseResult from "@/components/market/PurchaseResult";
import { formatMoney } from "@/lib/format";
import { ageLabel } from "@/lib/accountAge";
import GlassSelect from "@/components/ui/GlassSelect";

const QUICK_QTY = [5, 10, 20, 50, 100, 500, 1000];

// Platform service fee: $0.05 per $1 (5%) charged to the buyer on top of the price.
const feeOf = (amount) => Math.round(amount * 5) / 100;

// Capsule List — purchase page for one seller's country. Buy 1 directly, or
// open Buy Session Formats for batch sizes 5..1000 plus a custom quantity;
// every batch passes an explicit confirmation before the purchase runs.
export default function MarketBuy() {
  const { sellerId, countryIso } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { invoke, fetchMyData } = useTgIdentity();
  const { t } = useAppLang();
  // Stock pool chosen on the seller's page (?pool=spam) — Non-Spam by default.
  const pool =
    new URLSearchParams(window.location.search).get("pool") === "spam" ? "spam" : "nonspam";
  const [entry, setEntry] = useState(undefined); // undefined = loading, null = not found
  const [custom, setCustom] = useState("");
  const [formatsOpen, setFormatsOpen] = useState(false);
  const [pendingQty, setPendingQty] = useState(null); // quantity awaiting confirmation
  const [busy, setBusy] = useState(false);
  const [purchased, setPurchased] = useState(null); // last single purchase, shown on-page
  // Account age bucket picked by the buyer — each bucket has its own stock
  // and price (set by the seller on the Sell page).
  const [age, setAge] = useState(null);

  useEffect(() => {
    invoke("getMarketProducts", {})
      .then((res) => {
        const seller = (res.data.sellers || []).find((s) => s.id === sellerId);
        const country = seller?.countries.find((c) => c.country_iso === countryIso);
        setEntry(seller && country ? { seller, country } : null);
        const ages = (country?.ages || [])
          .map((a) => ({ ...a, stock: pool === "spam" ? a.spam_stock : a.nonspam_stock }))
          .filter((a) => Number(a.stock) > 0);
        // Age preselected from the seller page (?age=), else Regular, else first.
        const wanted = new URLSearchParams(window.location.search).get("age");
        setAge(
          ages.some((a) => a.category === wanted)
            ? wanted
            : ages.some((a) => a.category === "regular")
              ? "regular"
              : ages[0]?.category || null
        );
      })
      .catch(() => setEntry(null));
  }, [sellerId, countryIso]);

  // Age buckets available in the current stock pool.
  const poolAges = (entry?.country?.ages || [])
    .map((a) => ({ ...a, stock: pool === "spam" ? a.spam_stock : a.nonspam_stock }))
    .filter((a) => Number(a.stock) > 0);
  const ageInfo = poolAges.find((a) => a.category === age) || null;

  const stock = ageInfo
    ? Number(ageInfo.stock)
    : entry?.country == null
      ? 0
      : pool === "spam"
        ? entry.country.spam_stock ?? entry.country.stock ?? 0
        : entry.country.nonspam_stock ?? entry.country.stock ?? 0;
  const unitPrice = ageInfo ? Number(ageInfo.price) : entry?.country?.price ?? 0;
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
        spam_pool: pool,
        ...(age ? { age_category: age } : {}),
      });
      const bought = res.data.accounts || [];
      if (qty === 1 && bought[0]?.phone_number) {
        setPurchased(bought[0]);
        setEntry((prev) =>
          prev ? { ...prev, country: { ...prev.country, stock: Math.max(0, prev.country.stock - 1) } } : prev
        );
        toast({
          title: t("mk.accountPurchased"),
          description: t("mk.newBalance", { balance: formatMoney(res.data.balance) }),
        });
      } else {
        toast({
          title: t("mk.purchaseDone"),
          description: t("mk.batchDone", { count: res.data.count ?? bought.length, balance: formatMoney(res.data.balance) }),
        });
      }
      fetchMyData(true).catch(() => {});
      if (qty !== 1) navigate("/");
      setBusy(false);
    } catch (err) {
      toast({
        title: t("mk.purchaseFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      setBusy(false);
    }
  }

  if (entry === undefined) {
    return <p className="mk-fade text-[13px] text-[#a8a3cf]">{t("c.loading")}</p>;
  }
  if (entry === null) {
    return (
      <div className="mk-fade rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
        {t("bp.notFound")}
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
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> {t("c.back")}
        </button>

        <div className="mk-cap flex items-center gap-3.5 rounded-[30px] border border-[#A29BFE]/30 bg-gradient-to-br from-[rgba(45,38,78,.85)] to-[rgba(33,28,56,.9)] p-5">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-xl shadow-[0_0_0_2px_#13111C,0_0_0_4px_#6C5CE7,0_0_0_8px_rgba(108,92,231,.18)]">
            {country.flag || country.country_iso}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[10px] font-semibold uppercase tracking-[.14em] text-[#A29BFE]">
              {country.country_name}
              <span className="ml-1.5 normal-case tracking-normal">{dial}</span>
              {t("bp.fromLine", { name: seller.name })}
              </div>
            <div className="mt-1 bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] bg-clip-text font-display text-[34px] font-bold leading-none text-transparent tabular-nums">
              {formatMoney(unitPrice)}
            </div>
            <p className="mt-1 text-[13px] text-[#a8a3cf]">
              {pool === "spam" ? t("bp.spamStock") : t("bp.nonSpamStock")} · {stock} {t("c.inStock")}
            </p>
            {poolAges.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="shrink-0 text-[11px] font-semibold text-[#a8a3cf]">{t("sp.ageLabel")}</span>
                <GlassSelect
                  value={age || ""}
                  onChange={setAge}
                  options={poolAges.map((a) => ({
                    value: a.category,
                    label: `${ageLabel(a.category, t)} · ${formatMoney(a.price)}`,
                  }))}
                  className="min-w-0 flex-1"
                  triggerClass="h-8 rounded-full border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-3 text-[12px]"
                />
              </div>
            )}
          </div>
        </div>

        {purchased && (
          <PurchaseResult
            account={purchased}
            flag={country.flag}
            countryName={country.country_name}
          />
        )}

        {seller.is_self ? (
          <div className="mk-sec rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
            {t("bp.ownListing")}
          </div>
        ) : (
        <section className="mk-sec flex flex-col gap-3">
          <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#A29BFE]">{t("bp.buySection")}</div>
          <div className="flex flex-col gap-2.5 rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-3.5">
            <button
              type="button"
              disabled={busy || stock < 1}
              onClick={() => buy(1)}
              className="w-full cursor-pointer rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? t("c.buying") : t("bp.buy1")}
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
              {t("bp.buyFormats")}
            </button>

            <p className="px-1 text-center text-[11px] text-[#a8a3cf]">
              {t("bp.feeNote", { a: formatMoney(unitPrice), b: formatMoney(unitPrice + feeOf(unitPrice)) })}
            </p>

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
                      {t("bp.buyN", { n })}
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
                    placeholder={t("bp.customQty", { max: stock })}
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
                  <p className="text-[13px] font-semibold text-foreground">{t("bp.confirmTitle")}</p>
                  <div className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-[#a8a3cf]">
                    <div className="flex justify-between gap-2">
                      <span>{pendingQty} × {formatMoney(unitPrice)}</span>
                      <span className="tabular-nums">{formatMoney(pendingQty * unitPrice)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>{t("bp.serviceFee")}</span>
                      <span className="tabular-nums">{formatMoney(feeOf(pendingQty * unitPrice))}</span>
                    </div>
                    <div className="flex justify-between gap-2 font-semibold text-[#A29BFE]">
                      <span>{t("bp.totalCharge")}</span>
                      <span className="tabular-nums">
                        {formatMoney(pendingQty * unitPrice + feeOf(pendingQty * unitPrice))}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[#a8a3cf]">
                    {t("bp.deliveryNote")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => buy(pendingQty)}
                    className="flex-1 cursor-pointer rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? t("c.buying") : t("c.confirm")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPendingQty(null)}
                    className="flex-1 cursor-pointer rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-[18px] py-3 text-[13px] font-semibold text-foreground transition-[border-color] duration-200 hover:border-[#A29BFE]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("c.cancel")}
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