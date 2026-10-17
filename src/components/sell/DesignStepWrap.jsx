import React from "react";

// Content frame for the Sell wizard steps: a hairline on top and a slim amber
// rule running down the left edge of the step content.
export default function DesignStepWrap({ children }) {
  return (
    <div className="relative mt-[22px] flex flex-col border-t border-[#4A423B] pt-5 pl-4">
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px] rounded-[2px] bg-[linear-gradient(#FFAA33,#FFAA3322)]"
      />
      {children}
    </div>
  );
}