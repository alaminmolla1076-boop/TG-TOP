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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E6E1D6] bg-white">
      <div className="mx-auto grid max-w-md grid-cols-4 pt-1.5 pb-2">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-[3px] text-[11px] font-medium no-underline transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2453E6] ${
                isActive ? "text-[#2453E6]" : "text-[#5C6781] hover:text-[#2453E6]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-[34px] w-[34px] items-center justify-center rounded-full ${
                    isActive ? "bg-[#2453E6] text-white" : ""
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
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