import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles } from "lucide-react";
import { getMyNumbers, setNumberPrice } from "@/api/vipNumbers";
import { useAppLang } from "@/lib/AppLanguageContext";
import { ageLabel } from "@/lib/accountAge";
import { formatMoney } from "@/lib/format";
import CountryFlag from "@/components/CountryFlag";

const panel = "flex items-center gap-3 rounded-3xl border border-ring/[.22] bg-card/75 px-[18px] py-4 text-[13px] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]";

// VIP and +888 numbers are sold one at a time, so each one keeps its own
// price instead of the country-wide stock price edited above.
export default function NumberPricePanel() {
  const { toast } = useToast();
  const { t } = useAppLang();
  const [numbers, setNumbers] = useState(null);
  const [edits, setEdits] = useState({});
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setNumbers(await getMyNumbers());
    } catch {
      setNumbers([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const valueOf = (number) =>
    edits[number.id] !== undefined ? edits[number.id] : number.price != null ? String(number.price) : "";

  async function save(number) {
    const raw = valueOf(number);
    const price = Number(String(raw).trim());
    if (!String(raw).trim() || !Number.isFinite(price) || price <= 0) {
      toast({ title: t("s1.invalid"), description: t("s1.invalidDesc"), variant: "destructive" });
      return;
    }
    setBusyId(number.id);
    try {
      await setNumberPrice(number.id, price);
      toast({
        title: t("s1.updated"),
        description: `${number.phone_number} · ${formatMoney(price)}`,
      });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[number.id];
        return next;
      });
      await load();
    } catch (err) {
      toast({
        title: t("s1.updateFailed"),
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setBusyId(null);
  }

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-ring">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
        <h2 className="leading-[1.3]">{t("s1.numbers")}</h2>
      </div>

      {numbers === null ? (
        <div className={panel}>
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
          {t("c.loading")}
        </div>
      ) : numbers.length === 0 ? (
        <div className={panel}>
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-ring shadow-[0_0_8px_#6C5CE7]" />
          {t("s1.noNumbers")}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">{t("s1.numberPriceHint")}</p>
          {numbers.map((number) => (
            <div
              key={number.id}
              className="flex flex-col gap-2.5 rounded-[26px] border border-ring/[.22] bg-card/75 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_6px_16px_rgba(0,0,0,.28)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ring/30 bg-secondary/80">
                  <CountryFlag iso={number.country_iso} emoji={number.flag} label={number.country_name} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[15px] font-semibold text-foreground">{number.phone_number}</p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {number.country_name}
                    {number.dial_code ? ` +${String(number.dial_code).replace(/^\+/, "")}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-ring/35 bg-ring/[.14] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.06em] text-[#C9C4FF]">
                  {ageLabel(number.kind, t)}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  value={valueOf(number)}
                  onChange={(event) => setEdits((prev) => ({ ...prev, [number.id]: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={t("s1.unitPrice")}
                  inputMode="decimal"
                  className="h-10 min-w-0 flex-1 rounded-full border border-ring/30 bg-secondary/60 px-4 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                />
                <button
                  type="button"
                  onClick={() => save(number)}
                  disabled={busyId === number.id}
                  className="h-10 shrink-0 cursor-pointer rounded-full border border-ring/40 bg-ring/[.16] px-5 text-xs font-semibold text-[#C9C4FF] transition-[background-color] duration-200 hover:bg-ring/[.26] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  {busyId === number.id ? t("c.saving") : t("c.save")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
