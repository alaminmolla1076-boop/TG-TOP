import React from "react";
import { Trophy } from "lucide-react";

// Capsule List — Top Seller capsule with the Account-style concentric ring.
// The count comes from real completed sales (top_ups tagged account_sale);
// with no sales yet it truthfully shows 0.
export default function TopSellerCapsule({ topSeller }) {
  const sold = topSeller?.sold ?? 0;
  return (
    <div className="mk-cap flex items-center gap-3.5 rounded-[30px] border border-[#A29BFE]/30 bg-gradient-to-br from-[rgba(45,38,78,.85)] to-[rgba(33,28,56,.9)] p-5">
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] text-[#13111C] shadow-[0_0_0_2px_#13111C,0_0_0_4px_#6C5CE7,0_0_0_8px_rgba(108,92,231,.18)]">
        <Trophy className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#A29BFE]">
          Top Seller
        </div>
        <div className="mt-1 bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] bg-clip-text font-display text-[34px] font-bold leading-none text-transparent tabular-nums">
          {sold}
        </div>
        {topSeller?.name && (
          <p className="mt-1 truncate text-[13px] text-[#a8a3cf]">
            {topSeller.name}
            {topSeller.username ? ` · @${topSeller.username}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}