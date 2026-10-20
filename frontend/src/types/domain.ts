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
  solution: string;
  status: ProjectStatus;
  visibility: Visibility;
  researchLines: ResearchLine[];
  technologies: Technology[];
  liveUrl?: string;
  developers?: string[];
  trl?: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type TeamMemberRole =
  | "LEADER"
  | "COORDINATOR"
  | "RESEARCHER"
  | "STUDENT"
  | "ALUMNI";

export type TeamMember = {
  id: string;
  name: string;
  role: TeamMemberRole;
  roleLabel: string;
  bio: string;
  focusArea: string;
  researchLines: string[];
  status: MemberStatus;
  github?: string;
  email?: string;
  linkedin?: string;
};

export type PublicationType =
  | "ARTICLE"
  | "CONFERENCE"
  | "SOFTWARE_REGISTRY"
  | "TECHNICAL_REPORT";

export type Publication = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: PublicationType;
  typeLabel: string;
  venue: string;
  abstract: string;
  doi?: string;
  url?: string;
  tags: string[];
};
