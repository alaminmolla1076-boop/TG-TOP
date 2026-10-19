import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useAppLang } from "@/lib/AppLanguageContext";
import { KeyRound, Copy, Check } from "lucide-react";

const panelClass =
  "flex items-center gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";

// Seller's own stock numbers with the system 2FA password set at sale time —
// the password the account received when it was sold. Nordic Frost Glass.
export default function StockPasswords() {
  const { invoke } = useTgIdentity();
  const { t } = useAppLang();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(null);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (rows === null && !err) {
      try {
        setErr("");
        const res = await invoke("getMyStockPasswords", {});
        setRows(res.data?.accounts || []);
      } catch (e) {
        setErr(e.response?.data?.error || e.message);
      }
    }
  }

  async function copy(pwd, id) {
    try {
      await navigator.clipboard.writeText(pwd);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
      toast({ title: t("s1.twofaCopied") });
    } catch { /* clipboard unavailable — password stays visible for manual copy */ }
  }

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
        <KeyRound className="h-3.5 w-3.5" strokeWidth={1.5} />
        <h2 className="leading-[1.3]">{t("s1.twofa")}</h2>
        {open && rows !== null && (
          <Badge className="border border-ring/35 bg-ring/[.12] text-ring hover:bg-ring/[.12]">
            {t("s1.countryCount", { n: rows.length })}
          </Badge>
        )}
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground/80">{t("s1.twofaDesc")}</p>

      {!open ? (
        <Button
          onClick={toggle}
          className="h-11 w-full rounded-2xl border border-ring/35 bg-ring/[.14] text-[13px] font-semibold text-ring hover:bg-ring/[.2]"
        >
          {t("s1.twofaShow")}
        </Button>
      ) : (
        <div className="flex flex-col gap-2.5">
          <Button
            onClick={toggle}
            variant="ghost"
            className="h-8 w-full rounded-xl text-[11px] text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            {t("s1.twofaHide")}
          </Button>
          {err ? (
            <div className={`${panelClass} items-center`}>
              <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-red-400 shadow-[0_0_6px_#f87171]" />
              <p className="min-w-0 flex-1 break-words text-red-400/90">{t("s1.twofaErr")}</p>
            </div>
          ) : rows === null ? (
            <div className={`${panelClass} items-center`}>
              <span className="h-[7px] w-[7px] shrink-0 animate-pulse rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
              {t("c.loading")}
            </div>
          ) : rows.length === 0 ? (
            <div className={`${panelClass} items-center`}>
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
              {t("s1.twofaEmpty")}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {rows.map((r) => (
                <div key={r.id} className={panelClass}>
                  <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {(r.country_iso || "").toUpperCase()} · {r.phone_number}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[12px] tracking-wide text-ring">
                      {r.password}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(r.password, r.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ring/35 bg-ring/[.12] text-ring transition-colors hover:bg-ring/[.22]"
                    aria-label={t("s1.twofaCopied")}
                  >
                    {copied === r.id ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}