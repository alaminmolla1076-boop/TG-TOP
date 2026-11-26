import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Store, User } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Nordic Frost Glass — floating frosted pill navigation.
export default function BottomNav() {
  const { t } = useAppLang();
  const tabs = [
    { to: "/home", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/", label: t("nav.market"), icon: Store, end: true },
    { to: "/inventory", label: t("nav.inventory"), icon: Package },
    { to: "/account", label: t("nav.account"), icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 px-4 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 rounded-[28px] border border-white/10 bg-[#0B0D12]/80 p-2 shadow-[0_10px_26px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.07)] backdrop-blur-md">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 text-[11px] no-underline transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                isActive ? "text-[#A8C8FF]" : "text-muted-foreground hover:text-ring"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isActive
                      ? "bg-gradient-to-br from-[#4C8DFF] to-[#2D6FFD] shadow-[0_6px_18px_rgba(45,111,253,.6)]"
                      : ""
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.4} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}