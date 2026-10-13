import { PublicPageShell } from "@/components/layout/public-page-shell";

type PublicPlaceholderPageProps = {
  title: string;
  description: string;
};

export function PublicPlaceholderPage({
  title,
  description,
}: PublicPlaceholderPageProps) {
  return (
    <PublicPageShell>
      <h1 className="text-4xl font-semibold text-white">{title}</h1>
      <p className="mt-4 max-w-3xl text-slate-300">{description}</p>
    </PublicPageShell>
  );
}
