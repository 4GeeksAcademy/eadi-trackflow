"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { CandidateRecord } from "@/types/candidates";

type CandidatesListViewProps = {
  initialRecords: CandidateRecord[];
  fetchError: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  received: "Recibida",
  in_progress: "En proceso",
  selected: "Seleccionada",
  discarded: "Descartada",
};

const STAGE_LABELS: Record<string, string> = {
  pending: "Pendiente",
  review: "Revisión",
  personal_interview: "Entrevista personal",
  technical_interview: "Entrevista técnica",
  offer_presented: "Oferta presentada",
};

const STATUS_STYLES: Record<string, string> = {
  received: "bg-amber-50 text-amber-800 ring-amber-200",
  in_progress: "bg-blue-50 text-blue-800 ring-blue-200",
  selected: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  discarded: "bg-rose-50 text-rose-800 ring-rose-200",
};

function mapLabel(value: string, map: Record<string, string>) {
  return map[value] ?? value.replaceAll("_", " ");
}

function buildNextUrl(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function CandidatesListView({ initialRecords, fetchError }: CandidatesListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [lastSyncAtText, setLastSyncAtText] = useState("--:--:--");

  const updateSyncTime = () => {
    setLastSyncAtText(new Date().toLocaleTimeString("es-ES"));
  };

  const currentStatus = searchParams.get("status") ?? "";
  const currentStage = searchParams.get("stage") ?? "";
  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");

  const filteredRecords = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return initialRecords;
    }

    return initialRecords.filter((record) => {
      return (
        record.full_name.toLowerCase().includes(query) ||
        record.email.toLowerCase().includes(query)
      );
    });
  }, [initialRecords, searchText]);

  const totalCandidates = initialRecords.length;
  const inProgressCandidates = initialRecords.filter((record) => record.status === "in_progress").length;
  const selectedCandidates = initialRecords.filter((record) => record.status === "selected").length;

  const updateParam = (key: "status" | "stage", value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.replace(buildNextUrl(pathname, params), { scroll: false });
      updateSyncTime();
    });
  };

  const refreshList = () => {
    startTransition(() => {
      router.refresh();
      updateSyncTime();
    });
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
        updateSyncTime();
      });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [router, startTransition]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">TrackFlow Talent Ops</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Listado de candidaturas
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:text-sm">
                People & Talent • Panel interno
              </p>
              <Link
                href="/nuevo-formulario"
                className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Nuevo formulario
              </Link>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Revisión de candidaturas para procesos internos de contratación en TrackFlow.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">En listado actual</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{totalCandidates}</p>
            </article>
            <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-blue-700">En proceso</p>
              <p className="mt-1 text-3xl font-bold text-blue-900">{inProgressCandidates}</p>
            </article>
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-emerald-700">Seleccionadas</p>
              <p className="mt-1 text-3xl font-bold text-emerald-900">{selectedCandidates}</p>
            </article>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Sincronizado: {lastSyncAtText}
            </p>
            <button
              type="button"
              onClick={refreshList}
              className="inline-flex w-fit rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Refrescar ahora
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="search">
                Buscar por nombre o email
              </label>
              <input
                id="search"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Ej. ana@trackflow.com"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="status">
                Filtrar por estado
              </label>
              <select
                id="status"
                value={currentStatus}
                onChange={(event) => updateParam("status", event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Todos</option>
                <option value="received">Recibida</option>
                <option value="in_progress">En proceso</option>
                <option value="selected">Seleccionada</option>
                <option value="discarded">Descartada</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500" htmlFor="stage">
                Filtrar por etapa
              </label>
              <select
                id="stage"
                value={currentStage}
                onChange={(event) => updateParam("stage", event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Todas</option>
                <option value="pending">Pendiente</option>
                <option value="review">Revisión</option>
                <option value="personal_interview">Entrevista personal</option>
                <option value="technical_interview">Entrevista técnica</option>
                <option value="offer_presented">Oferta presentada</option>
              </select>
            </div>
          </div>

          {isPending ? (
            <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
              Sincronizando candidaturas...
            </p>
          ) : null}
        </section>

        {fetchError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm">
            <h2 className="text-lg font-semibold">No se pudo cargar el listado</h2>
            <p className="mt-1 text-sm">{fetchError}</p>
          </section>
        ) : null}

        {!fetchError && filteredRecords.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No hay candidaturas para esos filtros</h2>
            <p className="mt-2 text-sm text-slate-600">Ajusta estado, etapa o búsqueda para ver resultados.</p>
          </section>
        ) : null}

        {!fetchError && filteredRecords.length > 0 ? (
          <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{record.full_name}</h2>
                    <p className="mt-0.5 text-sm text-slate-600">{record.position}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      STATUS_STYLES[record.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"
                    }`}
                  >
                    {mapLabel(record.status, STATUS_LABELS)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    Etapa: {mapLabel(record.stage, STAGE_LABELS)}
                  </p>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/candidates/${record.id}`}
                    className="inline-flex rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}
