import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  LifeBuoy,
  Languages,
  Gift,
} from "lucide-react";

const items = [
  { to: "/deposit", label: "Top Up", icon: ArrowDownToLine },
  { to: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/language", label: "Language", icon: Languages },
  { to: "/refer", label: "Refer", icon: Gift },
];

// Nordic Frost Glass — top-left menu button with a frosted slide-in drawer.
export default function MenuDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-card/75 text-foreground shadow-[0_8px_20px_rgba(0,0,0,.35)] backdrop-blur-md transition-colors duration-200 hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-obsidian/70 backdrop-blur-sm"
            />
            <motion.aside
              key="panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col gap-1 border-r border-ring/[.28] bg-obsidian/[.96] p-5 shadow-[0_10px_26px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.07)] backdrop-blur-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-heading text-sm font-bold uppercase tracking-[.14em] text-[#A29BFE]">
                  Menu
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ring/[.28] bg-card/75 text-foreground transition-colors duration-200 hover:bg-accent/90"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              {items.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-full border border-ring/[.22] bg-[rgba(45,38,78,.5)] px-[16px] py-[13px] no-underline transition-[background-color,box-shadow] duration-200 hover:bg-accent/90 hover:shadow-[0_8px_20px_rgba(108,92,231,.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Icon className="h-5 w-5 shrink-0 text-ring" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </Link>
              ))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}