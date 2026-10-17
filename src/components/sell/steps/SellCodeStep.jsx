import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

export default function SellCodeStep({ phone, code, onCode, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-primary/10 shadow-[0_0_30px_-10px_hsl(var(--primary))]">
          <KeyRound className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </span>
        <h2 className="font-heading text-2xl font-bold">Enter the login code</h2>
        <p className="max-w-[280px] text-xs text-muted-foreground">
          We sent a Telegram login code to{" "}
          <span className="font-semibold text-foreground">{phone}</span>. Open that Telegram app to read it.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="sell-code">Login Code</Label>
        <Input
          id="sell-code"
          value={code}
          onChange={(e) => onCode(e.target.value)}
          placeholder="• • • • •"
          inputMode="numeric"
          autoFocus
          required
          className="h-12 rounded-2xl border-border/50 bg-card text-center text-lg font-bold tracking-[0.35em] focus-visible:ring-primary/50"
        />
      </div>
      <Button
        type="submit"
        disabled={!code.trim()}
        className="h-12 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-[0_0_30px_-8px_hsl(var(--primary))] hover:bg-primary/90"
      >
        Verify & continue
      </Button>
    </form>
  );
}