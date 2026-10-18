import React from "react";
import { LifeBuoy, Send } from "lucide-react";

const CHANNEL_URL = "https://t.me/tgtop_official";

export default function Support() {
  return (
    <div className="mk-sec flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)]">
          <LifeBuoy className="h-5 w-5 text-[#A29BFE]" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A29BFE]">Support</p>
          <h1 className="font-heading text-lg font-bold text-foreground">Need a hand?</h1>
        </div>
      </div>

      <div className="rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-[18px] text-[13px] leading-relaxed text-[#a8a3cf]">
        Message our support team on Telegram for help with top-ups, withdrawals,
        purchases or account sales. We usually reply quickly.
      </div>

      <a
        href={CHANNEL_URL}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80"
      >
        <Send className="h-4 w-4" strokeWidth={1.5} />
        Contact Support
      </a>
    </div>
  );
}