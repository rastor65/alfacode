import { InternalResourcePage } from "@/components/layout/internal-resource-page";
import { PreparedModuleCard } from "@/components/layout/prepared-module-card";

type ResourcePageProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function ResourcePage({
  title,
  description,
  eyebrow = "Recurso",
}: ResourcePageProps) {
  return (
    <InternalResourcePage eyebrow={eyebrow} title={title} description={description}>
      <PreparedModuleCard />
    </InternalResourcePage>
  );
}
