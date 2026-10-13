import { PublicHeader } from "@/components/layout/public-header";
import { PublicThemeProvider } from "@/components/theme/public-theme-provider";

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
    <PublicThemeProvider className="bg-site-page">
      <PublicHeader />
      <main className={`mx-auto ${widthClass} px-4 py-14 sm:px-6 lg:px-8`}>
        {children}
      </main>
    </PublicThemeProvider>
  );
}
