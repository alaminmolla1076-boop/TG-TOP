import React, { useState } from "react";

const QUICK_QTY = [5, 10, 20, 50, 100, 500, 1000];

// Quantity picker revealed under a selected country: a primary Buy 1 button,
// then quick batch sizes up to 1000 and a custom quantity input. The stock
// count caps every option. Nordic Frost Glass.
export default function CountryBuyPanel({ country, busy, onBuy }) {
  const [custom, setCustom] = useState("");
  const stock = country.stock || 0;
  const parsed = parseInt(custom, 10);
  const customValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= stock;

  return (
    <div className="mt-3 rounded-3xl border border-ring/[.22] bg-secondary/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
      <button
        type="button"
        disabled={busy || stock < 1}
        onClick={() => onBuy(1)}
        className="h-12 w-full cursor-pointer rounded-full bg-gradient-to-br from-primary to-[#8E7DFF] text-sm font-semibold text-primary-foreground shadow-[0_6px_18px_rgba(108,92,231,.5)] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Buying…" : "Buy 1"}
      </button>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {QUICK_QTY.map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy || n > stock}
            onClick={() => onBuy(n)}
            className="h-10 cursor-pointer rounded-full border border-ring/25 bg-secondary/80 text-xs font-semibold text-foreground transition-[border-color,opacity] duration-200 hover:border-ring/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Buy {n}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (customValid) onBuy(parsed);
        }}
      >
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder={`Custom quantity (max ${stock})`}
          inputMode="numeric"
          disabled={busy}
          className="h-11 min-w-0 flex-1 rounded-full border border-ring/25 bg-secondary/80 px-4 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 focus:border-ring focus:shadow-[0_0_0_3px_rgba(162,155,254,.22)] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !customValid}
          className="h-11 shrink-0 cursor-pointer rounded-full border border-ring/40 bg-primary/10 px-5 text-xs font-semibold uppercase tracking-[.06em] text-ring transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy
        </button>
      </form>
    </div>
  );
}