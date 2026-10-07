import { PublicHeader } from "@/components/layout/public-header";

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-[#05080d]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-white">Equipo AlfaCode</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Este modulo se conectara a `members` para publicar integrantes activos,
          alumni y responsables de lineas segun visibilidad.
        </p>
      </main>
    </div>
  );
}
