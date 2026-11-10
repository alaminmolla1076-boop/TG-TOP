import React, { useEffect, useState } from "react";
import { Copy, Link2, Loader2, Radio } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getSellerNumberOrders, submitNumberTransferTx, tonviewerTx } from "@/api/numberEscrow";
import { useAppLang } from "@/lib/AppLanguageContext";
import { escrowT, statusLabel, STATUS_STYLE } from "@/components/escrow/strings";
import { formatMoney } from "@/lib/format";
import TimeLeft from "@/components/escrow/TimeLeft";

const ACTIVE = ["awaiting_transfer", "verifying"];
const glass =
  "flex items-center gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";

// Seller side of the +888 escrow: the buyer TON address to transfer the NFT
// to, the hold countdown and the transaction hash field that releases the sale.
export default function SellerEscrowOrders({ refreshKey = 0 }) {
  const { toast } = useToast();
  const { lang } = useAppLang();
  const t = (key) => escrowT(lang, key);
  const [orders, setOrders] = useState(null);
  const [hashes, setHashes] = useState({});
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const res = await getSellerNumberOrders();
      setOrders(res.orders || []);
    } catch {
      setOrders([]);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  async function copyAddress(order) {
    try {
      await navigator.clipboard.writeText(order.ton_address || "");
      toast({ title: t("copied") });
    } catch {
      /* the clipboard can be blocked inside Telegram desktop */
    }
  }

  async function submit(order) {
    const hash = (hashes[order.id] || "").trim();
    if (!hash || busyId) return;
    setBusyId(order.id);
    try {
      await submitNumberTransferTx(order.id, hash);
      setHashes((prev) => ({ ...prev, [order.id]: "" }));
      await load();
    } catch (err) {
      toast({
        title: t("submitTx"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyId(null);
  }

  const rows = orders || [];
  const active = rows.filter((o) => ACTIVE.includes(o.status));
  const history = rows.filter((o) => !ACTIVE.includes(o.status)).slice(0, 6);

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
        <Radio className="h-3.5 w-3.5" strokeWidth={1.5} />
        <h2 className="leading-[1.3]">{t("sellerTitle")}</h2>
      </div>

      {orders === null ? (
        <div className={glass}>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : !active.length && !history.length ? (
        <div className={glass}>
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
          {t("sellerNone")}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {active.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-2.5 rounded-[26px] border border-ring/[.22] bg-card/75 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-mono text-sm font-semibold text-foreground">{order.phone_number}</p>
                <span
                  className={
                    "shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold " +
                    (STATUS_STYLE[order.status] || STATUS_STYLE.cancelled)
                  }
                >
                  {statusLabel(lang, order.status)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
                <span className="font-mono">{formatMoney(Number(order.price))}</span>
                {order.status === "awaiting_transfer" && (
                  <span className="flex items-center gap-1">
                    {t("remaining")}
                    <TimeLeft expiresAt={order.expires_at} className="font-mono tabular-nums text-ring" />
                  </span>
                )}
              </div>
              {order.ton_address && (
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-2.5">
                  <p className="min-w-0 flex-1 break-all font-mono text-[10.5px] leading-relaxed text-muted-foreground">
                    {order.ton_address}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyAddress(order)}
                    aria-label={t("copy")}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[.06] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              )}
              {order.status === "verifying" ? (
                <a
                  href={tonviewerTx(order.tx_hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-[11px] text-ring underline decoration-ring/40 underline-offset-2"
                >
                  {t("verifying")}
                </a>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10.5px] leading-relaxed text-muted-foreground">{t("txHint")}</p>
                  <div className="flex items-center gap-2">
                    <input
                      value={hashes[order.id] || ""}
                      onChange={(e) => setHashes((prev) => ({ ...prev, [order.id]: e.target.value }))}
                      placeholder={t("txLabel")}
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-full border border-white/12 bg-black/25 px-3 py-2 font-mono text-[11px] text-foreground outline-none focus:border-ring/50"
                    />
                    <button
                      type="button"
                      onClick={() => submit(order)}
                      disabled={busyId === order.id || !(hashes[order.id] || "").trim()}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-gradient-to-br from-primary to-[#8E7DFF] px-3 py-2 text-[11px] font-semibold text-white transition-opacity disabled:opacity-50"
                    >
                      {busyId === order.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                      {t("submitTx")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {history.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-card/60 px-3.5 py-2.5 text-[11.5px] text-muted-foreground"
            >
              <span className="min-w-0 truncate font-mono">{order.phone_number}</span>
              <span className="shrink-0 font-mono">{formatMoney(Number(order.price))}</span>
              <span
                className={
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold " +
                  (STATUS_STYLE[order.status] || STATUS_STYLE.cancelled)
                }
              >
                {statusLabel(lang, order.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
