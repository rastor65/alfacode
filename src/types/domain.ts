export type Visibility = "PRIVATE" | "INTERNAL" | "PUBLIC";

export type ProjectStatus =
  | "PROPOSAL"
  | "RESEARCH"
  | "DESIGN"
  | "DEVELOPMENT"
  | "VALIDATION"
  | "COMPLETED"
  | "ARCHIVED";

export type MemberStatus = "ACTIVE" | "INACTIVE" | "ALUMNI";

export type ResearchLine = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Technology = {
  id: string;
  name: string;
  slug: string;
  category: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  problemStatement: string;
  objective: string;
  status: ProjectStatus;
  visibility: Visibility;
  researchLines: ResearchLine[];
  technologies: Technology[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};
