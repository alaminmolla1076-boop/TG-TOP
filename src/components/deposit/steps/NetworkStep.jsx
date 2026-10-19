import React from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { LOGOS } from "@/components/deposit/logos";
import { useAppLang } from "@/lib/AppLanguageContext";

const CHAINS = [
  { value: "OKPAY", name: "Top Up with Okpay", okpay: true, badge: "USDT · Instant", desc: "Pay with OKPay — instant top-up, no network fees" },
  { value: "TON", name: "Keeper Wallet", logo: LOGOS.keeper, badge: "TON Coin", desc: "Connect Keeper first, then confirm your TON top-up" },
  { value: "TRC20", name: "Tron", logo: LOGOS.TRC20, badge: "USDT TRC20", desc: "USDT on Tron — low fees, fast confirmation" },
  { value: "ERC20", name: "Ethereum", logo: LOGOS.ERC20, badge: "USDT ERC20", desc: "USDT on Ethereum — higher gas fees" },
  { value: "BEP20", name: "BNB Chain", logo: LOGOS.BEP20, badge: "USDT BEP20", desc: "USDT on BNB Chain — low fees, fast confirmation" },
];

export default function NetworkStep({ amount, network, creating, onSelect }) {
  const { t } = useAppLang();
  const chains = [
    { value: "OKPAY", name: t("tn.okpay"), okpay: true, badge: t("tn.okpayBadge"), desc: t("tn.okpayDesc") },
    { value: "TON", name: "Keeper Wallet", logo: LOGOS.keeper, badge: "TON Coin", desc: t("tn.keeperDesc") },
    { value: "TRC20", name: "Tron", logo: LOGOS.TRC20, badge: "USDT TRC20", desc: t("tn.tronDesc") },
    { value: "ERC20", name: "Ethereum", logo: LOGOS.ERC20, badge: "USDT ERC20", desc: t("tn.ethDesc") },
    { value: "BEP20", name: "BNB Chain", logo: LOGOS.BEP20, badge: "USDT BEP20", desc: t("tn.bnbDesc") },
  ];
  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <h2 className="font-heading text-2xl font-bold">{t("tn.title")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("tn.desc", { amount: `$${amount}` })}
        </p>
      </div>

      <div className="grid gap-2.5">
        {chains.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onSelect(c.value)}
            disabled={creating}
            aria-busy={creating && network === c.value}
            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
              network === c.value
                ? "border-primary/60 bg-primary/10"
                : "border-border/50 bg-card hover:border-primary/40"
            }`}
          >
            {c.okpay ? (
              <img src={LOGOS.okpay} alt={c.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/60 p-2">
                <img src={c.logo} alt={c.name} className="h-8 w-8" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{c.name}</p>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {c.badge}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
            </div>
            {creating && network === c.value ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
            ) : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {t("tn.note")}
      </p>

    </div>
  );
}