import type { Metadata } from "next";
import { AcademicPageContent, type AcademicSearch } from "@/features/academic/academic-page";
export const metadata: Metadata = { title: "Producción académica", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: Promise<AcademicSearch> }) { return <AcademicPageContent searchParams={searchParams} />; }
