export function PreparedModuleCard() {
  return (
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
  );
}
