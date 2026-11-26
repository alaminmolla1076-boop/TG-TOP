import React, { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { useToast } from "@/components/ui/use-toast";
import { useAppLang } from "@/lib/AppLanguageContext";

export default function Refer() {
  const { identity } = useTgIdentity();
  const { toast } = useToast();
  const { t } = useAppLang();
  const [copied, setCopied] = useState(false);

  const referralLink = identity?.telegram_id
    ? `https://t.me/tgtopsbot?startapp=${identity.telegram_id}`
    : "";

  async function copy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t("sb.copied"), description: t("sb.copiedDesc") });
    } catch {
      toast({ title: t("c.copyFailed"), description: t("c.copyFailedHint", { what: t("ref.title") }), variant: "destructive" });
    }
  }

  return (
    <div className="mk-sec mx-auto flex w-full flex-col gap-4 lg:max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#6FA8FF]/40 bg-[rgba(108,92,231,.14)]">
          <Gift className="h-5 w-5 text-[#6FA8FF]" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6FA8FF]">{t("ref.title")}</p>
          <h1 className="font-heading text-lg font-bold text-foreground">{t("sb.refer")}</h1>
        </div>
      </div>

      <div className="rounded-[26px] border border-[#6FA8FF]/[.22] bg-[rgba(45,38,78,.5)] p-[18px] text-[13px] leading-relaxed text-[#8B93A7]">
        {t("ref.desc")}
      </div>

      {referralLink ? (
        <div className="flex gap-2">
          <p className="min-w-0 flex-1 truncate rounded-full border border-[#6FA8FF]/30 bg-[rgba(45,38,78,.7)] px-4 py-[13px] font-mono text-[12px] text-[#8B93A7]">
            {referralLink}
          </p>
          <button
            type="button"
            onClick={copy}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#6FA8FF]/30 bg-[rgba(45,38,78,.7)] px-[18px] text-xs font-semibold text-[#6FA8FF] transition-[border-color] duration-200 hover:border-[#6FA8FF]/70"
          >
            {copied ? <Check className="h-4 w-4" strokeWidth={1.5} /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
            {t("c.copy")}
          </button>
        </div>
      ) : (
        <p className="text-[13px] text-[#8B93A7]">{t("ref.none")}</p>
      )}
    </div>
  );
}