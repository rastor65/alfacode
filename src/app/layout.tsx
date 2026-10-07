import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alfacode.vercel.app"),
  title: {
    default: "AlfaCode | Research & Software Lab",
    template: "%s | AlfaCode",
  },
  description:
    "Plataforma institucional para gestionar proyectos, investigacion y produccion academica de AlfaCode.",
  openGraph: {
    title: "AlfaCode | Research & Software Lab",
    description:
      "Semillero de investigacion en desarrollo de software, inteligencia artificial, IoT e investigacion aplicada.",
    siteName: "AlfaCode",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-[#05080d] text-slate-100">{children}</body>
    </html>
  );
}
