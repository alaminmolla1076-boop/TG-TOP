import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Coins, ShieldCheck, ShoppingBag, Smartphone } from "lucide-react";
import { formatMoney } from "@/lib/format";

// Animates the balance from 0 to the target for a wallet-app feel.
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return undefined;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// Gradient hero card: avatar, name, balance, stats and the deposit pill.
export default function ProfileHero({ identity, data }) {
  const name =
    [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") ||
    (identity?.username ? `@${identity.username}` : "Telegram User");
  const balance = data?.balance ?? null;
  const animated = useCountUp(balance);
  const orders = data?.orders?.length ?? 0;
  const sales = data?.account_sales?.length ?? 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ rotate: -0.35, scale: 1.005 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 text-white shadow-xl shadow-emerald-500/20"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" />

      <div className="relative flex items-center gap-3">
        {identity?.photo_url ? (
          <Image
            src={identity.photo_url}
            alt={name}
            originWidth={160}
            originHeight={160}
            className="h-14 w-14 rounded-full object-cover ring-4 ring-white/30"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl font-semibold ring-4 ring-white/30 backdrop-blur">
            {(name || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg font-bold leading-tight">{name}</p>
          {identity?.username && (
            <p className="truncate text-sm text-emerald-100">@{identity.username}</p>
          )}
        </div>
        {identity?.role === "admin" && (
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </span>
        )}
      </div>

      <p className="relative mt-5 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-100/80">
        USDT Balance · ID {identity?.telegram_id || "…"}
      </p>
      <p className="relative mt-1 font-heading text-4xl font-extrabold tracking-tight drop-shadow-sm">
        {balance === null ? "…" : formatMoney(Number(animated.toFixed(2)))}
      </p>

      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
          <div className="flex items-center gap-1.5 text-emerald-100">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Orders</span>
          </div>
          <p className="mt-1 font-heading text-xl font-bold">{orders}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
          <div className="flex items-center gap-1.5 text-emerald-100">
            <Smartphone className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sales</span>
          </div>
          <p className="mt-1 font-heading text-xl font-bold">{sales}</p>
        </div>
      </div>

      <Button
        asChild
        className="relative mt-4 rounded-full bg-white px-5 font-semibold text-emerald-700 shadow-md hover:bg-emerald-50 hover:text-emerald-800"
      >
        <Link to="/deposit">
          <Coins className="mr-2 h-4 w-4" /> Top Up USDT
        </Link>
      </Button>
    </motion.section>
  );
}