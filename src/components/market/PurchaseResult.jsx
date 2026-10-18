import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Check, Copy, KeyRound } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";

// Purchase success card shown right on the buy page: the bought number with a
// copy button and Get Code, so the buyer can log in without leaving the page.
export default function PurchaseResult({ account, flag, countryName }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  async function handleGetCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await invoke("getAccountCode", { account_id: account.id });
      setCode(res.data.code);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      toast({ title: "No code yet", description: msg, variant: "destructive" });
    }
    setLoading(false);
  }

  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Select the number to copy it manually.", variant: "destructive" });
    }
  }

  return (
    <section className="mk-sec flex flex-col gap-3">
      <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#A29BFE]">Purchased</div>
      <div className="flex flex-col gap-2.5 rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-base font-bold text-[#A29BFE]">
            {flag || account.country_iso}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="min-w-0 truncate text-[15px] font-medium text-foreground">
                {account.phone_number}
              </p>
              <button
                type="button"
                onClick={() => handleCopy(account.phone_number)}
                className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] p-1.5 text-[#A29BFE] transition-[border-color] duration-200 hover:border-[#A29BFE]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
                aria-label="Copy number"
              >
                {copied === account.phone_number ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
              </button>
            </div>
            <p className="truncate text-[13px] text-[#a8a3cf]">{countryName}</p>
          </div>
        </div>

        {code ? (
          <div className="flex gap-2">
            <p className="min-w-0 flex-1 rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-4 py-2.5 text-center font-mono text-base font-bold tracking-[.3em] text-[#A29BFE]">
              {code}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(code)}
              className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-[18px] text-xs font-semibold text-[#A29BFE] transition-[border-color] duration-200 hover:border-[#A29BFE]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
              aria-label="Copy code"
            >
              {copied === code ? <Check className="h-4 w-4" strokeWidth={1.5} /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
              Copy code
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGetCode}
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" strokeWidth={1.5} />
            {loading ? "Fetching code…" : "Get Code"}
          </button>
        )}
        {error && !loading && <p className="text-[11px] text-[#a8a3cf]">{error}</p>}
      </div>
    </section>
  );
}