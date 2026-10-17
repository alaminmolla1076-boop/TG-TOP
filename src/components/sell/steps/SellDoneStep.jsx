import React from "react";
import { Button } from "@/components/ui/button";
import { PackageCheck } from "lucide-react";

export default function SellDoneStep({ result, onReset }) {
  return (
    <div className="grid gap-4 py-4 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-500/40 bg-green-500/10">
        <PackageCheck className="h-9 w-9 text-green-400" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-2xl font-bold">In your stock</h2>
      <p className="mx-auto max-w-[280px] text-sm text-muted-foreground">
        {result?.country ? `${result.country} · ` : ""}
        {result?.phone} is now in your stock with a system 2FA password.
      </p>
      <Button variant="secondary" onClick={onReset} className="mx-auto h-11 rounded-full px-6">
        Sell another account
      </Button>
    </div>
  );
}