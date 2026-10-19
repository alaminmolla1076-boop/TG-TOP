import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Store, Upload, User } from "lucide-react";
import { useAppLang } from "@/lib/AppLanguageContext";

// Nordic Frost Glass — floating frosted pill navigation.
export default function BottomNav() {
  const { t } = useAppLang();
  const tabs = [
    { to: "/", label: t("nav.market"), icon: Store, end: true },
    { to: "/home", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/sell", label: t("nav.sell"), icon: Upload },
    { to: "/account", label: t("nav.account"), icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="mx-auto grid max-w-md grid-cols-4 rounded-[28px] border border-ring/[.28] bg-obsidian/[.92] p-2 shadow-[0_10px_26px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.07)] backdrop-blur-md">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 text-[11px] no-underline transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                isActive ? "text-[#C9C4FF]" : "text-[#8d88b4] hover:text-ring"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isActive
                      ? "bg-gradient-to-br from-primary to-[#8E7DFF] shadow-[0_4px_14px_rgba(108,92,231,.55)]"
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