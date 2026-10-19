import type { Metadata } from "next";
import { RequestsPage, type RequestSearch } from "@/features/administration/requests-page";
export const metadata: Metadata = { title: "Trámites y solicitudes", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: Promise<RequestSearch> }) { return <RequestsPage searchParams={searchParams} />; }
