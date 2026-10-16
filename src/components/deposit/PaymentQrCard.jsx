import React, { useState } from "react";
import { Loader2, ScanLine } from "lucide-react";

export default function PaymentQrCard({ value, asset, network }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(value)}`;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-topup/20 bg-topup/5 px-4 py-5">
      <div className="flex items-center gap-2 text-xs font-medium text-topup-soft"><ScanLine className="h-4 w-4" />Scan to pay</div>
      <div className="relative flex h-52 w-52 items-center justify-center rounded-2xl bg-foreground p-2 text-background">
        {!loaded && !failed && <Loader2 aria-label="Loading QR code" className="absolute h-6 w-6 animate-spin" />}
        {failed ? <p role="alert" className="px-3 text-center text-xs">QR code unavailable. Copy the address below.</p> : <img src={url} alt={`${asset} ${network} payment QR code`} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={loaded ? "h-full w-full rounded-lg" : "h-full w-full opacity-0"} />}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">Only send {asset} using the <span className="font-semibold text-foreground">{network}</span> network.</p>
    </div>
  );
}