import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[#5C97FF]/40 bg-gradient-to-b from-[#4C8DFF] to-[#2D6FFD] text-white shadow-[0_10px_26px_-10px_rgba(45,111,253,.9),inset_0_1px_0_rgba(255,255,255,.28)] hover:brightness-110 active:brightness-95",
        gold:
          "border border-[#F2D9A0]/50 bg-gradient-to-b from-[#F2D9A0] to-[#C9A24A] text-[#231A06] shadow-[0_10px_26px_-12px_rgba(201,162,74,.85),inset_0_1px_0_rgba(255,255,255,.45)] hover:brightness-105",
        destructive:
          "border border-[#F0575C]/40 bg-gradient-to-b from-[#F0575C] to-[#D93A3F] text-white shadow-[0_10px_24px_-12px_rgba(217,58,63,.9)] hover:brightness-110",
        outline:
          "border border-white/[.12] bg-white/[.03] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md hover:border-white/20 hover:bg-white/[.07]",
        secondary:
          "border border-white/10 bg-white/[.05] text-foreground backdrop-blur-md hover:bg-white/[.09]",
        ghost: "text-muted-foreground hover:bg-white/[.06] hover:text-foreground",
        link: "text-[#6FA8FF] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-2xl px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
