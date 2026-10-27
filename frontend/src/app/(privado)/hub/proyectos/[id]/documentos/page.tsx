import type { Metadata } from "next";

import { ProjectDocuments } from "@/features/documents/components/project-documents";
import type { DocumentList } from "@/features/documents/types";
import { loadProjectData, loadTabCounts } from "@/features/projects/load-project";
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
  const [[project, documents, results], tabCounts] = await Promise.all([
    loadProjectData<[ProjectDetail, DocumentList, ResultList]>([projectPath, `${projectPath}/documents?pageSize=100`, `${projectPath}/research-results`], currentPath),
    loadTabCounts(id, currentPath),
  ]);

  return (
    <div className="mx-auto w-full max-w-430">
      <ProjectDocuments
        project={{ id: project.id, name: project.name, status: project.status, methodology: project.methodology, type: project.type }}
        tabCounts={tabCounts}
        documents={documents}
        results={results.items.map((result) => ({ id: result.id, title: result.title }))}
      />
    </div>
  );
}
