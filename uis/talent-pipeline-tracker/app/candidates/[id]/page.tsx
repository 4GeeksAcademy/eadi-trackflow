import { notFound } from "next/navigation";
import { fetchNotesByRecordId, fetchRecordById } from "@/services/candidates";
import type { CandidateRecord, Note } from "@/types/candidates";

import CandidateDetailClient from "./candidate-detail-client";

type CandidateDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = await params;
  let record: CandidateRecord | null = null;
  let notes: Note[] = [];
  let fetchError: string | null = null;

  try {
    [record, notes] = await Promise.all([fetchRecordById(id), fetchNotesByRecordId(id)]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al cargar candidatura.";
    if (message.includes("(404)")) {
      notFound();
    }
    fetchError = message;
  }

  if (fetchError || !record) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm">
            <h1 className="text-lg font-semibold">No se pudo cargar la candidatura</h1>
            <p className="mt-1 text-sm">{fetchError ?? "Error desconocido"}</p>
          </section>
        </section>
      </main>
    );
  }

  return <CandidateDetailClient initialRecord={record} initialNotes={notes} />;
}
