import { redirect } from "next/navigation";

export default async function ProjectTrackingRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/hub/proyectos/${encodeURIComponent(id)}?tab=seguimiento`);
}
