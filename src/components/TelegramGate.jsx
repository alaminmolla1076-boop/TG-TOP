import React from "react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/brand";
import { useTgIdentity } from "@/lib/TgIdentityContext";

export default function TelegramGate() {
  const { error } = useTgIdentity();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center text-foreground">
      <Image src={LOGO_URL} alt="TGTOP" originWidth={1055} originHeight={1004} className="h-20 w-20 rounded-xl" fittingType="fit" />
      <h1 className="font-heading text-2xl font-bold">TG TOP</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        This app runs inside Telegram. Open the TG TOP bot and tap "Open App" to continue.
      </p>
      {error ? (
        <p className="max-w-xs rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}