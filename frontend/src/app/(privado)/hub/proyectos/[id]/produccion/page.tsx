import type { Metadata } from "next";
import { AcademicPageContent, type AcademicSearch } from "@/features/academic/academic-page";
export const metadata: Metadata = { title: "Producción del proyecto", robots: { index: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<AcademicSearch> }) {
  const { id } = await params;
  return <AcademicPageContent projectId={id} searchParams={searchParams} />;
}
