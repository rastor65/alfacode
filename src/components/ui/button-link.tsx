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
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1feff]",
        variant === "primary" &&
          "bg-[#469eb4] text-[#031015] hover:bg-[#62bdd2]",
        variant === "secondary" &&
          "border border-cyan-100/20 bg-white/5 text-cyan-50 hover:bg-white/10",
        className,
      )}
      {...props}
    />
  );
}
