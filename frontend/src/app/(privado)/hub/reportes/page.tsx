import type { Metadata } from "next";

import { ReportsPage, type ReportSearch } from "@/features/tracking/reports-page";

export const metadata: Metadata = { title: "Reportes", robots: { index: false } };

export default function Page({ searchParams }: { searchParams: Promise<ReportSearch> }) {
  return <ReportsPage searchParams={searchParams} />;
}
