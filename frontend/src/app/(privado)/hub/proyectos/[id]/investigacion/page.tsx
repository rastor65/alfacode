import type { Metadata } from "next";

import type { DocumentList } from "@/features/documents/types";
import { ProjectHeader } from "@/features/projects/components/project-header";
import { loadProjectData } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import { ProjectResearch } from "@/features/research/components/project-research";
import type { ProjectLines, ProjectProfile, ResultList } from "@/features/research/types";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Investigación del proyecto",
  robots: { index: false },
};

export default async function ProjectResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectPath = `/projects/${encodeURIComponent(id)}`;
  const currentPath = `/hub/proyectos/${encodeURIComponent(id)}/investigacion`;
  await requireSessionUser(currentPath);
  const [project, lines, profile, results, documents] = await loadProjectData<
    [ProjectDetail, ProjectLines, ProjectProfile, ResultList, DocumentList]
  >(
    [
      projectPath,
      `${projectPath}/research-lines`,
      `${projectPath}/research-profile`,
      `${projectPath}/research-results`,
      `${projectPath}/documents?pageSize=100`,
    ],
    currentPath,
  );
  const resultDocuments = documents.items.flatMap((document) =>
    document.researchResult ? [{ id: document.id, title: document.title, resultId: document.researchResult.id }] : [],
  );

  const team = project.members.map((member) => ({ userId: member.userId, fullName: member.fullName }));
  const finished = project.status === "completed" || project.status === "cancelled";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProjectHeader project={project} eyebrow="Investigación" current="investigacion" />
      <p className="mt-4 text-sm text-hub-muted">
        {finished
          ? "El proyecto está finalizado: su información investigativa se puede consultar, pero no cambiar."
          : "Información investigativa del proyecto. Las tareas y el cronograma siguen en su propia pestaña."}
      </p>
      <div className="mt-6">
        <ProjectResearch
          projectId={project.id}
          researchProject={project.type === "research"}
          team={team}
          lines={lines}
          profile={profile}
          results={results}
          resultDocuments={resultDocuments}
        />
      </div>
    </div>
  );
}
