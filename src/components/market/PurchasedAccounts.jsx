import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Check, Copy, Download, KeyRound, Package } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import SectionHead from "./SectionHead";

// Capsule List — purchase history. Single purchases fetch their captured
// login code (Get Code); batch (session-format) purchases show one row per
// ZIP with a Download button that redelivers the ZIP to the Telegram chat.
export default function PurchasedAccounts({ purchases, batches = [], emptyText }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [codes, setCodes] = useState({}); // { [accountId]: { loading, code, error } }
  const [downloads, setDownloads] = useState({}); // { [batchId]: { loading } }
  const [copied, setCopied] = useState(null);

  const loading = purchases === null;
  const empty = !loading && purchases.length === 0 && batches.length === 0;

  async function handleGetCode(account) {
    setCodes((prev) => ({ ...prev, [account.id]: { loading: true } }));
    try {
      const res = await invoke("getAccountCode", { account_id: account.id });
      setCodes((prev) => ({
        ...prev,
        [account.id]: { loading: false, code: res.data.code },
      }));
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setCodes((prev) => ({ ...prev, [account.id]: { loading: false, error: msg } }));
      toast({ title: "No code yet", description: msg, variant: "destructive" });
    }
  }

  async function handleDownload(batch) {
    setDownloads((prev) => ({ ...prev, [batch.batch_id]: { loading: true } }));
    try {
      const res = await invoke("downloadSessions", { batch_id: batch.batch_id });
      if (res.data.telegram_sent) {
        toast({
          title: "ZIP sent to your Telegram chat",
          description: `${res.data.count} session file${res.data.count === 1 ? "" : "s"} delivered — 2FA already removed.`,
        });
      } else {
        toast({
          title: "Delivery failed",
          description: res.data.telegram_error || "The ZIP could not be sent to your chat.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Download failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setDownloads((prev) => ({ ...prev, [batch.batch_id]: { loading: false } }));
  }

  async function handleCopy(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Select the code to copy it manually.", variant: "destructive" });
    }
  }

  return (
    <section className="mk-sec flex flex-col gap-3">
      <SectionHead
        icon={<Package className="h-4 w-4" strokeWidth={1.5} />}
        title="My Purchases"
        badge={(purchases?.length ?? 0) + batches.length}
      />
      {loading ? (
        <p className="text-[13px] text-[#a8a3cf]">Loading…</p>
      ) : empty ? (
        <div className="rounded-[22px] border border-dashed border-[#A29BFE]/30 bg-[rgba(45,38,78,.3)] p-[18px] text-[13px] text-[#a8a3cf]">
          {emptyText || "No purchases yet — buy an account from a seller above."}
        </div>
      ) : (
        <>
          {batches.map((b) => {
            const dl = downloads[b.batch_id];
            return (
              <div
                key={b.batch_id}
                className="flex items-center gap-3 rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-3.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-base font-bold text-[#A29BFE]">
                  {b.flag || b.country_iso}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="min-w-0 truncate text-[15px] font-medium text-foreground">
                    {b.account_count} session formats
                  </p>
                  <p className="truncate text-[13px] text-[#a8a3cf]">
                    {b.country_name} · one ZIP with all sessions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(b)}
                  disabled={dl?.loading}
                  className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[16px] py-2.5 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" strokeWidth={1.5} />
                  {dl?.loading ? "Sending…" : "Download"}
                </button>
              </div>
            );
          })}

          {purchases.map((p) => {
            const state = codes[p.id];
            return (
              <div
                key={p.id}
                className="flex flex-col gap-2.5 rounded-[26px] border border-[#A29BFE]/[.22] bg-[rgba(45,38,78,.5)] p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)] text-base font-bold text-[#A29BFE]">
                    {p.flag || p.country_iso}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-[15px] font-medium text-foreground">
                        {p.phone_number || p.country_name}
                      </p>
                      {p.phone_number && (
                        <button
                          type="button"
                          onClick={() => handleCopy(p.phone_number)}
                          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] p-1.5 text-[#A29BFE] transition-[border-color] duration-200 hover:border-[#A29BFE]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
                          aria-label="Copy number"
                        >
                          {copied === p.phone_number ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                          ) : (
                            <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="truncate text-[13px] text-[#a8a3cf]">{p.country_name}</p>
                  </div>
                </div>

                {state?.code ? (
                  <div className="flex gap-2">
                    <p className="min-w-0 flex-1 rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-4 py-2.5 text-center font-mono text-base font-bold tracking-[.3em] text-[#A29BFE]">
                      {state.code}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(state.code)}
                      className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.7)] px-[18px] text-xs font-semibold text-[#A29BFE] transition-[border-color] duration-200 hover:border-[#A29BFE]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A29BFE]"
                      aria-label="Copy code"
                    >
                      {copied === state.code ? <Check className="h-4 w-4" strokeWidth={1.5} /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
                      Copy code
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGetCode(p)}
                    disabled={state?.loading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-gradient-to-br from-[#6C5CE7] to-[#8E7DFF] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" strokeWidth={1.5} />
                    {state?.loading ? "Fetching code…" : "Get Code"}
                  </button>
                )}
                {state?.error && !state?.loading && (
                  <p className="text-[11px] text-[#a8a3cf]">{state.error}</p>
                )}
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}