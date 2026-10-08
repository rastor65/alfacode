type InternalResourcePageProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function InternalResourcePage({
  eyebrow = "Recurso",
  title,
  description,
  children,
}: InternalResourcePageProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#347f92]">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[#10242c]">{title}</h1>
      <p className="mt-3 max-w-3xl text-[#5d7179]">{description}</p>
      {children}
    </div>
  );
}
