import { AppShell } from "@/components/layout/app-shell";

export default function InternalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
