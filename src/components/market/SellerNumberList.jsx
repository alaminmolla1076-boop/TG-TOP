import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart, Sparkles } from "lucide-react";
import { buyNumber, getSellerNumbers } from "@/api/vipNumbers";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel, isNumberKind } from "@/lib/accountAge";
import { formatMoney } from "@/lib/format";
import CountryFlag from "@/components/CountryFlag";
import SectionHead from "@/components/market/SectionHead";
import PurchaseResult from "@/components/market/PurchaseResult";
import EscrowBuyDialog from "@/components/escrow/EscrowBuyDialog";
import MyEscrowOrders from "@/components/escrow/MyEscrowOrders";

// VIP / +888 numbers on a seller's market page: each number is a single
// listing with the whole phone number, its own price and its own Buy button.
export default function SellerNumberList({ sellerEmail, isSelf }) {
  const { toast } = useToast();
  const { t } = useAppLang();
  const [numbers, setNumbers] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [result, setResult] = useState(null);
  // +888 numbers are Fragment NFTs: they are bought through the on-chain escrow.
  const [escrow, setEscrow] = useState(null);
  const [escrowRefresh, setEscrowRefresh] = useState(0);

  async function load() {
    if (!sellerEmail) return;
    try {
      const data = await getSellerNumbers(sellerEmail);
      setNumbers(data.numbers || []);
    } catch {
      setNumbers([]);
    }
  }

  useEffect(() => {
    load();
  }, [sellerEmail]);

  async function buy(number) {
    if (busyId) return;
    setBusyId(number.id);
    try {
      const res = await buyNumber(number.id);
      setResult({ account: res.account, countryName: res.country_name, flag: res.flag });
      toast({
        title: t("mk.numberBought"),
        description: `${number.phone_number} · ${formatMoney(res.price)}`,
      });
      await load();
    } catch (err) {
      toast({
        title: t("mk.numberBuyFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyId(null);
  }

  const groups = ["vip", "p888"]
    .map((kind) => ({ kind, rows: (numbers || []).filter((n) => n.kind === kind) }))
    .filter((group) => group.rows.length > 0);

  if (numbers !== null && !groups.length && !result) return null;

  return (
    <div className="flex flex-col gap-4">
      {result && (
        <PurchaseResult account={result.account} flag={result.flag} countryName={result.countryName} />
      )}
      {groups.map(({ kind, rows }) => (
        <section key={kind} className="mk-sec flex flex-col gap-2.5">
          <SectionHead
            icon={<Sparkles className="h-4 w-4" strokeWidth={1.5} />}
            title={ageLabel(kind, t)}
            badge={rows.length}
          />
          {rows.map((number) => (
            <div
              key={number.id}
              className="flex items-center gap-3 rounded-[22px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)]">
                <CountryFlag iso={number.country_iso} emoji={number.flag} label={number.country_name} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[15px] font-semibold text-foreground">{number.phone_number}</p>
                <p className="truncate text-[12px] text-[#a8a3cf]">
                  {number.country_name}
                  {number.dial_code ? ` · +${String(number.dial_code).replace(/^\+/, "")}` : ""}
                </p>
              </div>
              <span className="shrink-0 bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] bg-clip-text font-display text-[15px] font-bold text-transparent tabular-nums">
                {formatMoney(number.price)}
              </span>
              {!isSelf && (
                <button
                  type="button"
                  onClick={() => (number.kind === "p888" ? setEscrow(number) : buy(number))}
                  disabled={busyId === number.id}
                  aria-label={t("c.buy")}
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] text-white shadow-[0_4px_14px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </section>
      ))}
      <MyEscrowOrders sellerEmail={sellerEmail} refreshKey={escrowRefresh} />
      <EscrowBuyDialog
        number={escrow}
        open={!!escrow}
        onClose={() => setEscrow(null)}
        onDone={() => {
          setEscrowRefresh((n) => n + 1);
          load();
        }}
      />
    </div>
  );
}
