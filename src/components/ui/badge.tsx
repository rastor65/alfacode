import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-cyan-100/15 bg-cyan-100/8 px-2.5 py-1 text-xs font-medium text-cyan-50",
        className,
      )}
    >
      {children}
    </span>
  );
}
