import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Flag, Send, ShieldCheck } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useTelegramBackButton } from "@/lib/useTelegramBackButton";
import { useToast } from "@/components/ui/use-toast";

// Report Seller — flag a seller with their username, ID and the type of scam.
export default function ReportSeller() {
  useTelegramBackButton();
  const { t } = useAppLang();
  const { invoke } = useTgIdentity();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [scamType, setScamType] = useState("not_delivered");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const labelCls = "text-[10px] font-bold uppercase tracking-widest text-[#A29BFE]";
  const fieldCls =
    "w-full rounded-2xl border border-ring/[.25] bg-[rgba(45,38,78,.5)] px-4 py-3 text-[13px] text-foreground placeholder:text-[#a8a3cf]/60 transition-colors duration-200 focus:border-[#A29BFE]/60 focus:outline-none";

  const scamTypes = [
    { value: "not_delivered", label: t("rs.type.not_delivered") },
    { value: "invalid_account", label: t("rs.type.invalid_account") },
    { value: "scam", label: t("rs.type.scam") },
    { value: "price_manipulation", label: t("rs.type.price_manipulation") },
    { value: "other", label: t("rs.type.other") },
  ];

  const submit = async () => {
    if (!username.trim()) {
      toast({ title: t("rs.required"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await invoke("reportSeller", {
        seller_username: username.trim(),
        seller_id: sellerId.trim(),
        scam_type: scamType,
        details: details.trim(),
      });
      setDone(true);
    } catch (error) {
      toast({
        title: error.response?.data?.error || t("rs.error"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setUsername("");
    setSellerId("");
    setScamType("not_delivered");
    setDetails("");
    setDone(false);
  };

  if (done) {
    return (
      <div className="mk-sec flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] px-[18px] py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)]">
            <ShieldCheck className="h-7 w-7 text-[#A29BFE]" strokeWidth={1.5} />
          </span>
          <p className="max-w-[280px] text-[13px] leading-relaxed text-[#a8a3cf]">{t("rs.success")}</p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-ring/[.25] bg-card/75 px-[18px] py-3 text-[13px] font-semibold text-foreground transition-colors duration-200 hover:bg-accent/90"
        >
          {t("rs.another")}
        </button>
      </div>
    );
  }

  return (
    <div className="mk-sec flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)]">
          <Flag className="h-5 w-5 text-[#A29BFE]" strokeWidth={1.5} />
        </span>
        <div>
          <p className={labelCls}>{t("menu.report")}</p>
          <h1 className="font-heading text-lg font-bold text-foreground">{t("rs.heading")}</h1>
        </div>
      </div>

      <div className="rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-[18px] text-[13px] leading-relaxed text-[#a8a3cf]">
        {t("rs.desc")}
      </div>

      <div className="flex flex-col gap-4 rounded-[26px] border border-ring/[.22] bg-card/75 p-[18px]">
        <label className="flex flex-col gap-2">
          <span className={labelCls}>{t("rs.username")} *</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("rs.usernamePh")}
            maxLength={64}
            className={fieldCls}
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>{t("rs.id")}</span>
          <input
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            placeholder={t("rs.idPh")}
            maxLength={64}
            className={fieldCls}
            inputMode="numeric"
            autoComplete="off"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className={labelCls}>{t("rs.type")} *</span>
          <div className="flex flex-col gap-2">
            {scamTypes.map(({ value, label }) => {
              const active = scamType === value;
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setScamType(value)}
                  className={
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-[13px] font-semibold transition-colors duration-200 " +
                    (active
                      ? "border-[#A29BFE]/60 bg-[rgba(108,92,231,.18)] text-foreground"
                      : "border-ring/[.25] bg-[rgba(45,38,78,.5)] text-[#a8a3cf] hover:bg-accent/90")
                  }
                >
                  {label}
                  <span
                    className={
                      "h-2.5 w-2.5 rounded-full " +
                      (active ? "bg-[#A29BFE] shadow-[0_0_10px_rgba(162,155,254,.9)]" : "bg-ring/30")
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelCls}>{t("rs.details")}</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t("rs.detailsPh")}
            maxLength={1000}
            rows={4}
            className={fieldCls + " resize-none"}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 disabled:opacity-60"
      >
        <Send className="h-4 w-4" strokeWidth={1.5} />
        {submitting ? t("rs.submitting") : t("rs.submit")}
      </button>

      <p className="px-1 text-center text-[11px] text-muted-foreground">
        <Link to="/" className="underline-offset-2 hover:underline">
          ← {t("c.back")}
        </Link>
      </p>
    </div>
  );
}