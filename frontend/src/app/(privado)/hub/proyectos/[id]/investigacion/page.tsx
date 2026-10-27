import type { Metadata } from "next";

import type { DocumentList } from "@/features/documents/types";
import { loadProjectData, loadTabCounts } from "@/features/projects/load-project";
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
  const [[project, lines, profile, results, documents], tabCounts] = await Promise.all([
    loadProjectData<[ProjectDetail, ProjectLines, ProjectProfile, ResultList, DocumentList]>(
      [
        projectPath,
        `${projectPath}/research-lines`,
        `${projectPath}/research-profile`,
        `${projectPath}/research-results`,
        `${projectPath}/documents?pageSize=100`,
      ],
      currentPath,
    ),
    loadTabCounts(id, currentPath),
  ]);
  const resultDocuments = documents.items.flatMap((document) =>
    document.researchResult ? [{ id: document.id, title: document.title, resultId: document.researchResult.id }] : [],
  );

  return (
    <div className="mx-auto w-full max-w-430">
      <ProjectResearch
        project={{ id: project.id, name: project.name, status: project.status, methodology: project.methodology, type: project.type }}
        tabCounts={tabCounts}
        researchProject={project.type === "research"}
        team={project.members.map((member) => ({ userId: member.userId, fullName: member.fullName }))}
        lines={lines}
        profile={profile}
        results={results}
        resultDocuments={resultDocuments}
      />
    </div>
  );
}
