import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-hub-badge-border bg-hub-badge-bg px-2.5 py-1 text-xs font-medium text-hub-badge-text",
        className,
      )}
    >
      {children}
    </span>
  );
}
