import type { Metadata } from "next";

import { DocumentsList } from "@/features/documents/components/documents-list";
import type { DocumentList } from "@/features/documents/types";
import { ProjectHeader } from "@/features/projects/components/project-header";
import { loadProjectData } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import type { ResultList } from "@/features/research/types";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Documentos del proyecto",
  robots: { index: false },
};

export default async function ProjectDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectPath = `/projects/${encodeURIComponent(id)}`;
  const currentPath = `/hub/proyectos/${encodeURIComponent(id)}/documentos`;
  await requireSessionUser(currentPath);
  const [project, documents, results] = await loadProjectData<[ProjectDetail, DocumentList, ResultList]>(
    [projectPath, `${projectPath}/documents?pageSize=100`, `${projectPath}/research-results`],
    currentPath,
  );

  const finished = project.status === "completed" || project.status === "cancelled";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProjectHeader project={project} eyebrow="Documentos" current="documentos" />
      <p className="mt-4 text-sm text-hub-muted">
        {finished
          ? "El proyecto está finalizado: sus documentos se pueden descargar, pero no cambiar."
          : "Propuestas, informes, entregables y evidencias del proyecto. Solo ves los documentos a los que tienes acceso."}
      </p>
      <div className="mt-6">
        <DocumentsList
          documents={documents.items}
          scope="project"
          projectId={project.id}
          results={results.items.map((result) => ({ id: result.id, title: result.title }))}
          limits={documents.upload}
          canUpload={Boolean(documents.permissions.canUpload)}
          emptyMessage="Aún no hay documentos en este proyecto que puedas consultar."
        />
      </div>
      {documents.total > documents.items.length && (
        <p className="mt-3 text-sm text-hub-muted">
          Se muestran los {documents.items.length} más recientes de {documents.total}. Usa el repositorio de documentos para buscar.
        </p>
      )}
    </div>
  );
}
