import React from "react";

// Auth pages: a single centered card on mobile, and a two-column layout with
// the brand block beside the form on desktop.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md lg:max-w-4xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="text-center mb-10 lg:mb-0 lg:text-left">
          <div className="inline-flex items-center justify-center w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-primary mb-4 lg:mb-6">
            <Icon className="w-7 h-7 lg:w-10 lg:h-10 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 lg:mt-3 lg:text-base">{subtitle}</p>}
        </div>
        <div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 lg:p-10">
            {children}
          </div>
          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
