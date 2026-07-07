export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-900">Cargando información...</p>
          <p className="mt-1 text-sm text-blue-800">Estamos obteniendo los datos más recientes de candidaturas.</p>
        </section>
      </section>
    </main>
  );
}
