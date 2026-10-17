import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Check, Copy, KeyRound, PackageCheck } from "lucide-react";
import { useTgIdentity } from "@/lib/TgIdentityContext";

// Purchased accounts list (Market page): single purchases show the stock login
// number with a Get Code button under it — the code Supabase captured in
// otp_requests when the account was bought. Batch purchases received their
// session formats in the Telegram chat.
export default function PurchasedAccounts({ purchases }) {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [codes, setCodes] = useState({}); // { [accountId]: { loading, code, error } }
  const [copied, setCopied] = useState(null);

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
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <PackageCheck className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-base font-semibold">My Purchases</h2>
        <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
          {purchases?.length ?? 0}
        </Badge>
      </div>
      {purchases === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : purchases.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No purchases yet — buy an account from a seller above.
        </p>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => {
            const state = codes[p.id];
            const isSingle = p.purchase_type !== "season";
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-border/60 bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-base">
                    {p.flag || p.country_iso}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {p.phone_number || p.country_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.country_name}
                      {!isSingle && " · session formats sent to your Telegram chat"}
                    </p>
                  </div>
                </div>

                {isSingle && (
                  <div className="mt-3 flex flex-col gap-2">
                    {state?.code ? (
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 rounded-2xl border border-ring/25 bg-secondary/80 px-4 py-2.5 font-mono text-base font-bold tracking-[0.3em] text-ring">
                          {state.code}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(state.code)}
                          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-ring/25 bg-secondary/80 text-ring transition-[border-color] duration-200 hover:border-ring/60"
                          aria-label="Copy code"
                        >
                          {copied === state.code ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGetCode(p)}
                        disabled={state?.loading}
                        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-ring/40 bg-primary/10 text-xs font-semibold uppercase tracking-[.06em] text-ring transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <KeyRound className="h-4 w-4" />
                        {state?.loading ? "Fetching code…" : "Get Code"}
                      </button>
                    )}
                    {state?.error && !state?.loading && (
                      <p className="text-[11px] text-muted-foreground">{state.error}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}