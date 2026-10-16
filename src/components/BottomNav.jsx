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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/80 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
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