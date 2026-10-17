import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Store, Upload, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/market", label: "Market", icon: Store },
  { to: "/sell", label: "Sell", icon: Upload },
  { to: "/account", label: "Account", icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2a3036] bg-[#1B1F23]">
      <div className="mx-auto grid max-w-md grid-cols-4 pt-2 pb-2.5">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] no-underline transition-colors duration-200 ${
                isActive ? "text-[#F39C12]" : "text-[#9aa3ab] hover:text-[#F39C12]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isActive ? "border border-[#F39C12]" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.3} />
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