import React, { useState } from "react";
import { Search, X } from "lucide-react";

// Capsule List Market — seller search bar. Search filters the seller
// directory by username (or name) on the server; Clear restores the full list.
export default function SellerSearchBar({ onSearch, onClear, searching, activeQuery }) {
  const [value, setValue] = useState("");
  const q = value.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!q || searching) return;
    onSearch(q);
  };

  const clear = () => {
    setValue("");
    if (activeQuery) onClear();
  };

  return (
    <form
      onSubmit={submit}
      className="mk-fade flex items-center gap-2 rounded-full border border-[#A29BFE]/30 bg-[rgba(45,38,78,.5)] p-1.5 pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]"
    >
      <Search className="h-4 w-4 shrink-0 text-[#a8a3cf]" strokeWidth={1.5} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search seller by username"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-[#a8a3cf] focus:outline-none"
      />
      {activeQuery && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.22)] text-[#A29BFE] transition-colors duration-200 hover:bg-[rgba(108,92,231,.4)]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      )}
      <button
        type="submit"
        disabled={!q || searching}
        className="shrink-0 cursor-pointer rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.25)] px-4 py-1.5 text-[13px] font-semibold text-[#A29BFE] transition-colors duration-200 hover:bg-[rgba(108,92,231,.45)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {searching ? "…" : "Search"}
      </button>
    </form>
  );
}