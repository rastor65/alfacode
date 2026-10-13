import { CircleAlert, CircleCheck, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type AlertProps = {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
};

const TONES = {
  error: { icon: CircleAlert, className: "border-hub-danger-border bg-hub-danger-bg text-hub-danger-text" },
  success: { icon: CircleCheck, className: "border-hub-success-border bg-hub-success-bg text-hub-success-text" },
  info: { icon: Info, className: "border-hub-info-border bg-hub-info-bg text-hub-info-text" },
};

/** Mensaje en linea. Los errores se anuncian de inmediato a lectores de pantalla. */
export function Alert({ tone = "info", children, className }: AlertProps) {
  const { icon: Icon, className: toneClassName } = TONES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed", toneClassName, className)}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
