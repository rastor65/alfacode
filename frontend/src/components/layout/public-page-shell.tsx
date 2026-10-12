import { PublicHeader } from "@/components/layout/public-header";

type PublicPageShellProps = {
  children: React.ReactNode;
  maxWidth?: "default" | "narrow";
};

export function PublicPageShell({
  children,
  maxWidth = "default",
}: PublicPageShellProps) {
  const widthClass = maxWidth === "narrow" ? "max-w-5xl" : "max-w-7xl";

  return (
    <div className="min-h-screen bg-[#05080d]">
      <PublicHeader />
      <main className={`mx-auto ${widthClass} px-4 py-14 sm:px-6 lg:px-8`}>
        {children}
      </main>
    </div>
  );
}
