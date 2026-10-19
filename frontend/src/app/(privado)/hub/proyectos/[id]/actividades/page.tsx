import type { Metadata } from "next";
import { EventsPageContent, type EventSearch } from "@/features/events/events-page";
export const metadata: Metadata = { title: "Actividades del proyecto", robots: { index: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<EventSearch> }) { const { id } = await params; return <EventsPageContent projectId={id} searchParams={searchParams} />; }
