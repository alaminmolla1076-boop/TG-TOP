import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Flag,
  Gift,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  ShieldCheck,
  Store,
  Package,
  User,
  Wallet,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/brand";
import { formatMoney } from "@/lib/format";
import { useAppLang } from "@/lib/AppLanguageContext";
import { useTgIdentity } from "@/lib/TgIdentityContext";

// Desktop shell: a frosted left rail with the main tabs plus the service
// shortcuts, so a laptop or PC gets real desktop navigation instead of the
// mobile bottom pill. Hidden below the lg breakpoint.
export default function DesktopSidebar({ balance }) {
  const { t } = useAppLang();
  const { fetchMyData } = useTgIdentity();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchMyData()
      .then((d) => setIsAdmin(d?.role === "admin"))
      .catch(() => {});
  }, [fetchMyData]);

  const primary = [
    { to: "/home", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/", label: t("nav.market"), icon: Store, end: true },
    { to: "/inventory", label: t("nav.inventory"), icon: Package },
    { to: "/account", label: t("nav.account"), icon: User },
  ];

  const secondary = [
    { to: "/deposit", label: t("menu.topUp"), icon: ArrowDownToLine },
    { to: "/withdraw", label: t("menu.withdraw"), icon: ArrowUpFromLine },
    { to: "/support", label: t("menu.support"), icon: LifeBuoy },
    { to: "/language", label: t("menu.language"), icon: Languages },
    { to: "/refer", label: t("menu.refer"), icon: Gift },
    { to: "/report-seller", label: t("menu.report"), icon: Flag },
    ...(isAdmin ? [{ to: "/admin", label: t("menu.admin"), icon: ShieldCheck }] : []),
  ];

  const itemClass = (isActive) =>
    "flex items-center gap-3 rounded-full border px-4 py-2.5 text-[13px] font-semibold no-underline transition-colors duration-200 " +
    (isActive
      ? "border-ring/45 bg-[rgba(108,92,231,.24)] text-[#C9C4FF]"
      : "border-transparent text-[#a8a3cf] hover:border-ring/25 hover:bg-accent/60 hover:text-foreground");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col gap-5 overflow-y-auto border-r border-ring/[.22] bg-obsidian/[.94] px-5 py-6 backdrop-blur-md lg:flex">
      <div className="flex items-center gap-2.5 px-1">
        <Image
          src={LOGO_URL}
          alt="TGTOP"
          originWidth={1055}
          originHeight={1004}
          className="h-10 w-10 object-contain"
          fittingType="fit"
        />
        <span className="font-heading text-sm font-bold uppercase tracking-[.18em] text-ring">TGTOP</span>
      </div>

      <div className="rounded-[22px] border border-ring/30 bg-gradient-to-br from-[#2D264E]/85 to-card/90 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-ring">
          <Wallet className="h-3 w-3" strokeWidth={1.6} /> {t("a.balance")}
        </p>
        <p className="mt-1.5 font-mono text-[19px] font-bold leading-none text-foreground">
          {balance === null || balance === undefined ? "\u2026" : formatMoney(balance)}
        </p>
      </div>

      <nav className="flex flex-col gap-1.5">
        {primary.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (
              <>
                <span
                  className={
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                    (isActive
                      ? "bg-gradient-to-br from-primary to-[#8E7DFF] text-white shadow-[0_4px_14px_rgba(108,92,231,.55)]"
                      : "text-[#8d88b4]")
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="h-px w-full bg-ring/[.18]" />

      <nav className="flex flex-col gap-1">
        {secondary.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => itemClass(isActive)}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
