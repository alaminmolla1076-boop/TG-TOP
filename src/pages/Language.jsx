import React, { useState } from "react";
import { Languages, Check } from "lucide-react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
];

const STORAGE_KEY = "tgtops-language";

export default function Language() {
  const [selected, setSelected] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "en"
  );

  function pick(code) {
    setSelected(code);
    localStorage.setItem(STORAGE_KEY, code);
  }

  return (
    <div className="mk-sec flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A29BFE]/40 bg-[rgba(108,92,231,.14)]">
          <Languages className="h-5 w-5 text-[#A29BFE]" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A29BFE]">Language</p>
          <h1 className="font-heading text-lg font-bold text-foreground">Choose your language</h1>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {LANGS.map(({ code, label }) => {
          const active = selected === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => pick(code)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-full border px-[18px] py-[14px] text-left transition-[background-color,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A29BFE] ${
                active
                  ? "border-[#A29BFE]/60 bg-[rgba(108,92,231,.22)] shadow-[0_8px_20px_rgba(108,92,231,.3)]"
                  : "border-ring/[.22] bg-[rgba(45,38,78,.5)] hover:bg-accent/90"
              }`}
            >
              <span className="text-sm font-semibold text-foreground">{label}</span>
              {active && <Check className="h-4 w-4 text-[#A29BFE]" strokeWidth={2} />}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-[#a8a3cf]">More languages coming soon.</p>
    </div>
  );
}