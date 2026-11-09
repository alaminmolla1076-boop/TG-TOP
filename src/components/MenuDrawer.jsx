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
    { to: "/deposit", label: t("menu.topUp"), icon: ArrowDownToLine },
    { to: "/withdraw", label: t("menu.withdraw"), icon: ArrowUpFromLine },
    { to: "/support", label: t("menu.support"), icon: LifeBuoy },
    { to: "/language", label: t("menu.language"), icon: Languages },
    { to: "/refer", label: t("menu.refer"), icon: Gift },
    { to: "/report-seller", label: t("menu.report"), icon: Flag },
    ...(isAdmin ? [{ to: "/admin", label: t("menu.admin"), icon: ShieldCheck }] : []),
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
                className="fixed inset-0 z-50 bg-obsidian/75 backdrop-blur-md"
              />
              <motion.aside
                key="panel"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
                className="fixed inset-y-0 left-0 z-50 flex w-[84%] max-w-[320px] flex-col overflow-hidden border-r border-ring/[.22] bg-[linear-gradient(180deg,#171320_0%,#100d18_55%,#0b0910_100%)] shadow-[0_10px_40px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl"
              >
                <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[#6C5CE7]/25 blur-[70px]" />

                <div className="relative flex items-center justify-between px-5 pb-4 pt-5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-[3px] rounded-full bg-gradient-to-b from-[#A29BFE] to-[#6C5CE7]" />
                    <p className="font-heading text-[13px] font-bold uppercase tracking-[.18em] text-[#C9C4FF]">
                      {t("menu.title")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t("menu.title")}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-ring/[.25] bg-white/[.05] text-[#B7B2D9] transition-colors duration-200 hover:bg-white/[.1] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <X className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>

                <nav className="relative flex flex-1 flex-col gap-[6px] overflow-y-auto px-4 pb-6">
                  {items.map(({ to, label, icon: Icon }, i) => (
                    <motion.div
                      key={to}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.24, delay: 0.05 + i * 0.035 }}
                    >
                      <Link
                        to={to}
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-3 rounded-[16px] border border-white/[.07] bg-white/[.035] px-3 py-[10px] no-underline transition-[background-color,border-color,transform] duration-200 hover:border-ring/40 hover:bg-ring/[.12] active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border border-ring/[.22] bg-ring/[.12] text-[#C9C4FF] transition-colors duration-200 group-hover:bg-ring/[.22] group-hover:text-white">
                          <Icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold tracking-[.01em] text-foreground">
                          {label}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-[#8d88b4] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#C9C4FF]"
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
