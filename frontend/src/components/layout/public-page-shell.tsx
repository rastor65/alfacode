import { PublicHeader } from "@/components/layout/public-header";
import { PublicThemeProvider } from "@/components/theme/public-theme-provider";
import { HomeFooter } from "@/features/home/components/home-footer";
import { TechInteractiveBackground } from "@/features/home/components/tech-interactive-background";

type PublicPageShellProps = {
  children: React.ReactNode;
  maxWidth?: "default" | "narrow" | "wide";
  showFooter?: boolean;
  withInteractiveBackground?: boolean;
};

export function PublicPageShell({
  children,
  maxWidth = "default",
  showFooter = true,
  withInteractiveBackground = false,
}: PublicPageShellProps) {
  const widthClass =
    maxWidth === "narrow"
      ? "max-w-5xl"
      : maxWidth === "wide"
      ? "max-w-[1400px]"
      : "max-w-7xl";

  return (
    <PublicThemeProvider className="relative flex min-h-screen flex-col bg-site-bg overflow-x-hidden">
      {withInteractiveBackground && <TechInteractiveBackground />}
      <PublicHeader />
      {/* Máscara de difuminado y gradiente detrás del navbar al hacer scroll */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24 sm:h-28 backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] bg-gradient-to-b from-site-bg/95 via-site-bg/60 to-transparent"
        aria-hidden="true"
      />
      {/* El padding-top pt-28 sm:pt-32 lg:pt-36 erradica el solapamiento con la cabecera fija */}
      <main
        className={`relative z-10 mx-auto w-full flex-1 ${widthClass} px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20 lg:px-8 lg:pt-36 lg:pb-24`}
      >
        {children}
      </main>
      {showFooter && <HomeFooter />}
    </PublicThemeProvider>
  );
}
