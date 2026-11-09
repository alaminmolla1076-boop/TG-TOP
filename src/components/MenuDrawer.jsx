import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  LifeBuoy,
  Languages,
  Gift,
  Flag,
  ShieldCheck,
} from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import { LOGO_URL } from "@/lib/brand";

// Nordic Frost Glass — top-left menu button with a frosted slide-in drawer.
export default function MenuDrawer() {
  const [open, setOpen] = useState(false);
  const { t } = useAppLang();
  const { fetchMyData } = useTgIdentity();
  const [isAdmin, setIsAdmin] = useState(false);

  // The admin entry shows only for admins — the role comes from the shared
  // account-data cache, so this joins the header's in-flight call.
  useEffect(() => {
    fetchMyData().then((d) => setIsAdmin(d?.role === "admin")).catch(() => {});
  }, [fetchMyData]);

  const items = [
    {
      to: "/deposit",
      label: t("menu.topUp"),
      icon: ArrowDownToLine,
      tile: "from-emerald-400/30 to-emerald-500/10 text-emerald-300 border-emerald-300/25",
      glow: "hover:border-emerald-300/35 hover:bg-emerald-400/[.07]",
    },
    {
      to: "/withdraw",
      label: t("menu.withdraw"),
      icon: ArrowUpFromLine,
      tile: "from-sky-400/30 to-sky-500/10 text-sky-300 border-sky-300/25",
      glow: "hover:border-sky-300/35 hover:bg-sky-400/[.07]",
    },
    {
      to: "/support",
      label: t("menu.support"),
      icon: LifeBuoy,
      tile: "from-amber-400/30 to-amber-500/10 text-amber-300 border-amber-300/25",
      glow: "hover:border-amber-300/35 hover:bg-amber-400/[.07]",
    },
    {
      to: "/language",
      label: t("menu.language"),
      icon: Languages,
      tile: "from-[#A29BFE]/30 to-[#6C5CE7]/10 text-[#C9C4FF] border-[#A29BFE]/30",
      glow: "hover:border-ring/45 hover:bg-ring/[.1]",
    },
    {
      to: "/refer",
      label: t("menu.refer"),
      icon: Gift,
      tile: "from-pink-400/30 to-pink-500/10 text-pink-300 border-pink-300/25",
      glow: "hover:border-pink-300/35 hover:bg-pink-400/[.07]",
    },
    {
      to: "/report-seller",
      label: t("menu.report"),
      icon: Flag,
      tile: "from-rose-400/30 to-rose-500/10 text-rose-300 border-rose-300/25",
      glow: "hover:border-rose-300/35 hover:bg-rose-400/[.07]",
    },
    ...(isAdmin
      ? [
          {
            to: "/admin",
            label: t("menu.admin"),
            icon: ShieldCheck,
            tile: "from-[#8E7DFF]/35 to-[#6C5CE7]/10 text-[#DCD8FF] border-[#A29BFE]/35",
            glow: "hover:border-[#A29BFE]/50 hover:bg-[#6C5CE7]/[.12]",
          },
        ]
      : []),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("menu.title")}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-card/75 text-foreground shadow-[0_8px_20px_rgba(0,0,0,.35)] backdrop-blur-md transition-colors duration-200 hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {createPortal(
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
                className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-lg"
              />
              <motion.aside
                key="panel"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[324px] flex-col overflow-hidden rounded-r-[30px] border-r border-white/[.08] bg-[linear-gradient(165deg,#1b1626_0%,#141020_45%,#0a0810_100%)] shadow-[0_20px_60px_rgba(0,0,0,.65)]"
              >
                <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[#6C5CE7]/25 blur-[80px]" />
                <div className="pointer-events-none absolute -bottom-24 -right-16 h-48 w-48 rounded-full bg-[#8E7DFF]/15 blur-[70px]" />

                <div className="relative flex items-start justify-between px-5 pt-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[.1] bg-white/[.05] shadow-[inset_0_1px_0_rgba(255,255,255,.1)]">
                      <img src={LOGO_URL} alt="TGTOP" className="h-8 w-8 object-contain" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="font-display text-[15px] font-bold leading-none tracking-[-0.01em] text-foreground">
                        TGTOP
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8d88b4]">
                        {t("menu.title")}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t("menu.title")}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/[.1] bg-white/[.05] text-[#B7B2D9] transition-colors duration-200 hover:bg-white/[.12] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <X className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>

                <div className="relative mx-5 mt-5 h-px bg-gradient-to-r from-transparent via-white/[.14] to-transparent" />

                <nav className="relative flex flex-1 flex-col gap-[7px] overflow-y-auto px-4 pb-8 pt-5">
                  {items.map(({ to, label, icon: Icon, tile, glow }, i) => (
                    <motion.div
                      key={to}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.26, delay: 0.06 + i * 0.035 }}
                    >
                      <Link
                        to={to}
                        onClick={() => setOpen(false)}
                        className={`group relative flex items-center gap-3 overflow-hidden rounded-[18px] border border-white/[.07] bg-white/[.03] px-3 py-2.5 no-underline transition-[background-color,border-color,transform,box-shadow] duration-200 hover:shadow-[0_10px_24px_-12px_rgba(0,0,0,.9)] active:scale-[.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${glow}`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border bg-gradient-to-br ${tile} transition-transform duration-200 group-hover:scale-[1.06]`}
                        >
                          <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold tracking-[.01em] text-foreground/95">
                          {label}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-[#7a759e] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground/80"
                          strokeWidth={1.8}
                        />
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
