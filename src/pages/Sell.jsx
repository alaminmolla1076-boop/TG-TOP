import React, { useEffect, useState } from "react";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatMoney } from "@/lib/format";

const saleStatusStyle = {
  pending: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  code_sent: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  completed: "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/10",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/10",
};

export default function Sell() {
  const { toast } = useToast();
  const { invoke } = useTgIdentity();
  const [countries, setCountries] = useState(null);
  const [sales, setSales] = useState(null);
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await invoke("getMyData", {});
    setCountries(res.data.countries || []);
    setSales(res.data.account_sales || []);
  }

  useEffect(() => {
    load().catch(() => {
      setCountries([]);
      setSales([]);
    });
  }, []);

  const selected = countries?.find((c) => c.country_iso === country);
  const reward = selected ? Number(selected.reward_price) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await invoke("sellAccount", {
        country_iso: country,
        phone_number: phone.trim(),
      });
      toast({
        title: "Account submitted for sale",
        description: `You will earn ${formatMoney(res.data.sale.reward_amount)} after validation (about ${res.data.sale.reward_wait_hours} hours).`,
      });
      setPhone("");
      load();
    } catch (err) {
      toast({
        title: "Could not submit",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Sell Account</h1>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-border/60 bg-card p-4">
        <div className="grid gap-1.5">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue
                placeholder={countries === null ? "Loading…" : "Select your account's country"}
              />
            </SelectTrigger>
            <SelectContent>
              {(countries || []).map((c) => (
                <SelectItem key={c.country_iso} value={c.country_iso}>
                  {c.flag} {c.country_name} — {formatMoney(Number(c.reward_price))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <p className="text-[11px] text-muted-foreground">
              Reward: {formatMoney(reward)} after validation (about {selected.reward_wait_hours} hours).
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="s-phone">Telegram Phone Number</Label>
          <Input
            id="s-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+8801XXXXXXXXX"
            required
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          After submitting, our system will send a Telegram login code to this number — follow the instructions to complete the sale.
        </p>
        <Button type="submit" disabled={saving || !country || !phone.trim() || countries === null}>
          {saving ? "Submitting…" : "Sell Account"}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">My Account Sales</h2>
        {sales === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {sales.map((s) => (
              <div key={s.id} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-medium">
                    {s.country_iso} · {s.phone_number}
                  </p>
                  <Badge className={saleStatusStyle[s.status] || saleStatusStyle.pending}>{s.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reward: {formatMoney(Number(s.reward_amount))} · {s.reward_status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}