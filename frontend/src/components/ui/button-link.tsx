import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
};

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071018]",
        variant === "primary" &&
          "bg-gradient-to-r from-[#3fa2ba] to-[#5ecce3] text-[#031015] shadow-[0_4px_20px_rgba(70,158,180,0.35)] hover:shadow-[0_6px_25px_rgba(70,158,180,0.5)] hover:brightness-105",
        variant === "secondary" &&
          "border border-cyan-400/25 bg-slate-900/60 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-cyan-400/50 hover:bg-slate-800/80 hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
