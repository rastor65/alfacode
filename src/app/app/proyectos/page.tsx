import { InternalProjectsPage as InternalProjectsView } from "@/features/projects/components/internal-projects-page";
import { getAllProjectsForAdmin } from "@/features/projects/services/project-repository";

export const dynamic = "force-dynamic";

export default async function InternalProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  return <InternalProjectsView projects={projects} />;
}
