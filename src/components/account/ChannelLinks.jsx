import React from "react";
import { Send, MessageCircle, ChevronRight } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

const CHANNEL_URL = "https://t.me/tgtop_official";
const GROUP_URL = "https://t.me/+ed7Log0sWJ01Nzk9";

const btnClass =
  "flex items-center gap-2 rounded-full border border-ring/[.28] bg-secondary/80 px-3.5 py-[10px] text-[12.5px] font-semibold text-foreground no-underline " +
  "shadow-[0_8px_20px_rgba(0,0,0,.3),inset_0_1px_0_rgba(255,255,255,.07)] " +
  "transition-[background-color,box-shadow] duration-200 hover:bg-accent/90 hover:shadow-[0_10px_24px_rgba(108,92,231,.3)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Nordic Frost Glass — channel & group shortcuts under the stat buttons.
export default function ChannelLinks() {
  const { t } = useAppLang();
  return (
    <div className="og-rise grid grid-cols-2 gap-2 [animation-delay:.4s]">
      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={btnClass}>
        <Send className="h-4 w-4 shrink-0 text-ring" strokeWidth={1.7} />
        <span className="min-w-0 flex-1 truncate">{t("sb.channel")}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8d88b4]" strokeWidth={2} />
      </a>
      <a href={GROUP_URL} target="_blank" rel="noreferrer" className={btnClass}>
        <MessageCircle className="h-4 w-4 shrink-0 text-ring" strokeWidth={1.7} />
        <span className="min-w-0 flex-1 truncate">{t("sb.group")}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8d88b4]" strokeWidth={2} />
      </a>
    </div>
  );
}
