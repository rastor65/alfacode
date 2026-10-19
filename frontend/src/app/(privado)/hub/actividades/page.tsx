import type { Metadata } from "next";
import { EventsPageContent, type EventSearch } from "@/features/events/events-page";
export const metadata: Metadata = { title: "Eventos y actividades", robots: { index: false } };
export default function Page({ searchParams }: { searchParams: Promise<EventSearch> }) { return <EventsPageContent searchParams={searchParams} />; }
