import { PublicHeader } from "@/components/layout/public-header";

export default function PublicationsPage() {
  return (
    <div className="min-h-screen bg-[#05080d]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-white">Publicaciones</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          La produccion academica se gestionara desde `publications` y sus
          autores relacionados, separada de los articulos editoriales.
        </p>
      </main>
    </div>
  );
}
