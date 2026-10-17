import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone } from "lucide-react";

export default function SellPhoneStep({ phone, onPhone, onSubmit, busy }) {
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-primary/10 shadow-[0_0_30px_-10px_hsl(var(--primary))]">
          <Smartphone className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </span>
        <h2 className="font-heading text-2xl font-bold">Your number</h2>
        <p className="max-w-[280px] text-xs text-muted-foreground">
          We will send a Telegram login code to this number. Open that Telegram app to read it.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="sell-phone">Telegram Phone Number</Label>
        <Input
          id="sell-phone"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          placeholder="+8801XXXXXXXXX"
          inputMode="tel"
          disabled={busy}
          required
          className="h-12 rounded-2xl border-border/50 bg-card text-base font-bold focus-visible:ring-primary/50"
        />
      </div>
      <Button
        type="submit"
        disabled={busy}
        className="h-12 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-[0_0_30px_-8px_hsl(var(--primary))] hover:bg-primary/90"
      >
        {busy ? "Sending code…" : "Send login code"}
      </Button>
    </form>
  );
}