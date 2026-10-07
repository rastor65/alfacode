type ResourcePageProps = {
  title: string;
  description: string;
};

export function ResourcePage({ title, description }: ResourcePageProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#347f92]">
        Recurso
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[#10242c]">{title}</h1>
      <p className="mt-3 max-w-3xl text-[#5d7179]">{description}</p>

      <div className="mt-8 rounded-xl border border-dashed border-[#bfe9f0] bg-[#f1fafc] p-8">
        <div className="flex max-w-xl items-start gap-4">
          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-md border border-[#bfe9f0] bg-white">
            <span className="size-2 rounded-full bg-[#469eb4]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#10242c]">
              Modulo preparado
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5d7179]">
              Esta vista ya esta conectada al sistema de permisos. El siguiente
              paso es implementar sus tablas, filtros y formularios especificos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
