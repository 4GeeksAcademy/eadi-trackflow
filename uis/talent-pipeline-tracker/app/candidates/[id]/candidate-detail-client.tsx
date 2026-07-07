"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { createNote, fetchNotesByRecordId, patchRecord, removeNote } from "@/services/candidates";
import type { CandidateRecord, Note } from "@/types/candidates";

type CandidateDetailClientProps = {
  initialRecord: CandidateRecord;
  initialNotes: Note[];
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

function mapLabel(value: string, map: Record<string, string>) {
  return map[value] ?? value.replaceAll("_", " ");
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function statusBadgeClass(status: string) {
  if (status === "selected") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "in_progress") return "bg-blue-50 text-blue-800 ring-blue-200";
  if (status === "discarded") return "bg-rose-50 text-rose-800 ring-rose-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
}

export default function CandidateDetailClient({ initialRecord, initialNotes }: CandidateDetailClientProps) {
  const [record, setRecord] = useState<CandidateRecord>(initialRecord);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [noteText, setNoteText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(initialRecord.status);
  const [selectedStage, setSelectedStage] = useState(initialRecord.stage);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingStage, setSavingStage] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => Object.keys(STATUS_LABELS).map((key) => ({ key, label: STATUS_LABELS[key] })),
    []
  );

  const stageOptions = useMemo(
    () => Object.keys(STAGE_LABELS).map((key) => ({ key, label: STAGE_LABELS[key] })),
    []
  );

  const loadNotes = async () => {
    setLoadingNotes(true);
    setError(null);

    try {
      const data = await fetchNotesByRecordId(record.id);
      setNotes(data);
      setRecord((current) => ({ ...current, notes_count: data.length }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error inesperado al cargar notas.");
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleStatusUpdate = async () => {
    setSavingStatus(true);
    setFeedback(null);
    setError(null);

    try {
      const updated = await patchRecord(record.id, { status: selectedStatus });
      setRecord(updated);
      setSelectedStage(updated.stage);
      setSelectedStatus(updated.status);
      setFeedback("Estado actualizado correctamente.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error inesperado al actualizar estado.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStageUpdate = async () => {
    setSavingStage(true);
    setFeedback(null);
    setError(null);

    try {
      const updated = await patchRecord(record.id, { stage: selectedStage });
      setRecord(updated);
      setSelectedStage(updated.stage);
      setSelectedStatus(updated.status);
      setFeedback("Etapa actualizada correctamente.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error inesperado al actualizar etapa.");
    } finally {
      setSavingStage(false);
    }
  };

  const handleAddNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!noteText.trim()) {
      setError("La nota no puede estar vacía.");
      return;
    }

    setSavingNote(true);
    setFeedback(null);
    setError(null);

    try {
      await createNote(record.id, noteText.trim());

      setNoteText("");
      await loadNotes();
      setFeedback("Nota creada correctamente.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error inesperado al crear nota.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    setFeedback(null);
    setError(null);

    try {
      await removeNote(record.id, noteId);

      await loadNotes();
      setFeedback("Nota eliminada correctamente.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error inesperado al eliminar nota.");
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Detalle de candidatura</p>
            <Link
              href="/"
              className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Volver al listado
            </Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{record.full_name}</h1>
          <p className="mt-1 text-sm text-slate-600">{record.position}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(record.status)}`}>
              {mapLabel(record.status, STATUS_LABELS)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Etapa: {mapLabel(record.stage, STAGE_LABELS)}
            </span>
          </div>
        </header>

        {feedback ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
            {feedback}
          </section>
        ) : null}

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
            {error}
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Información completa</h2>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <span className="font-medium text-slate-500">Nombre:</span> {record.full_name}
            </p>
            <p>
              <span className="font-medium text-slate-500">Email:</span> {record.email}
            </p>
            <p>
              <span className="font-medium text-slate-500">Teléfono:</span> {record.phone}
            </p>
            <p>
              <span className="font-medium text-slate-500">Puesto:</span> {record.position}
            </p>
            <p>
              <span className="font-medium text-slate-500">Años de experiencia:</span> {record.experience_years}
            </p>
            <p>
              <span className="font-medium text-slate-500">Estado:</span> {mapLabel(record.status, STATUS_LABELS)}
            </p>
            <p>
              <span className="font-medium text-slate-500">Etapa:</span> {mapLabel(record.stage, STAGE_LABELS)}
            </p>
            <p>
              <span className="font-medium text-slate-500">Aplicación:</span> {formatDate(record.applied_at)}
            </p>
            <p className="sm:col-span-2">
              <span className="font-medium text-slate-500">LinkedIn:</span>{" "}
              {record.linkedin_url ? (
                <a
                  className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                  href={record.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {record.linkedin_url}
                </a>
              ) : (
                "No disponible"
              )}
            </p>
            <p className="sm:col-span-2">
              <span className="font-medium text-slate-500">Enlace a CV:</span>{" "}
              {record.cv_url ? (
                <a
                  className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                  href={record.cv_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {record.cv_url}
                </a>
              ) : (
                "No disponible"
              )}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Actualizar estado</h2>
            <p className="mt-1 text-sm text-slate-600">Envia PATCH /records/:id con el estado seleccionado.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                aria-label="Seleccionar estado"
              >
                {statusOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={savingStatus}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {savingStatus ? "Guardando..." : "Guardar estado"}
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Actualizar etapa</h2>
            <p className="mt-1 text-sm text-slate-600">Envia PATCH /records/:id con la etapa seleccionada.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                value={selectedStage}
                onChange={(event) => setSelectedStage(event.target.value)}
                aria-label="Seleccionar etapa"
              >
                {stageOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStageUpdate}
                disabled={savingStage}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {savingStage ? "Guardando..." : "Guardar etapa"}
              </button>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Notas ({record.notes_count})</h2>
          <p className="mt-1 text-sm text-slate-600">Listado obtenido desde GET /records/:id/notes.</p>

          <form className="mt-4 flex flex-col gap-3" onSubmit={handleAddNote}>
            <label className="text-sm font-medium text-slate-700" htmlFor="new-note">
              Nueva nota
            </label>
            <textarea
              id="new-note"
              className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              placeholder="Escribe una observación sobre la candidatura..."
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
            />
            <div>
              <button
                type="submit"
                disabled={savingNote}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {savingNote ? "Guardando..." : "Añadir nota"}
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {loadingNotes ? <p className="text-sm text-slate-500">Cargando notas...</p> : null}

            {!loadingNotes && notes.length === 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Esta candidatura no tiene notas todavía.
              </p>
            ) : null}

            {!loadingNotes
              ? notes.map((note) => (
                  <article key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm leading-relaxed text-slate-800">{note.content}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">{formatDate(note.created_at)}</p>
                      <button
                        type="button"
                        onClick={() => void handleDeleteNote(note.id)}
                        disabled={deletingNoteId === note.id}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:opacity-70"
                      >
                        {deletingNoteId === note.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </article>
                ))
              : null}
          </div>
        </section>
      </section>
    </main>
  );
}
