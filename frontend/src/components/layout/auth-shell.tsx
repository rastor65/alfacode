import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { getThemePreference } from "@/lib/theme-server";

type AuthShellProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Marco de las pantallas de acceso: header minimo con selector de tema y tarjeta centrada. */
export async function AuthShell({ title, description, children, footer }: AuthShellProps) {
  const theme = await getThemePreference();

  return (
    <ThemeProvider initialTheme={theme} className="flex flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full text-sm font-bold tracking-tight text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-hub-badge-border bg-hub-badge-bg p-1 text-hub-accent">
            <AlfaCodeSymbol className="size-full" />
          </span>
          <span>
            Alfa<span className="text-hub-accent">Code</span> <span className="font-medium text-hub-muted">HUB</span>
          </span>
        </Link>
        <ThemeMenu variant="icon" placement="bottom" align="end" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-12 pt-4 sm:px-6">
        <div className="w-full max-w-md">
          <section className="hub-panel rounded-3xl px-6 py-8 sm:px-8 sm:py-10" aria-labelledby="auth-title">
            <h1 id="auth-title" className="text-2xl font-bold tracking-tight text-hub-text text-balance">
              {title}
            </h1>
            {description && <p className="mt-2 text-sm leading-relaxed text-hub-muted">{description}</p>}
            <div className="mt-8">{children}</div>
          </section>
          {footer && <div className="mt-6 text-center text-sm text-hub-muted">{footer}</div>}
          <p className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded text-sm text-hub-muted transition hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Volver al sitio
            </Link>
          </p>
        </div>
      </main>
    </ThemeProvider>
  );
}
