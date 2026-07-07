"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createRecord, deleteRecord, fetchRecordById, replaceRecord } from "@/services/candidates";
import type { RecordPayload } from "@/types/candidates";

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: string;
};

const EMPTY_FORM: FormState = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
};

function normalizePayload(form: FormState): RecordPayload {
  const experience = Number(form.experience_years);

  return {
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    position: form.position.trim(),
    linkedin_url: form.linkedin_url.trim() ? form.linkedin_url.trim() : null,
    cv_url: form.cv_url.trim() ? form.cv_url.trim() : null,
    experience_years: Number.isFinite(experience) ? experience : NaN,
  };
}

function validateForm(form: FormState) {
  const errors: string[] = [];
  const payload = normalizePayload(form);

  if (!payload.full_name) errors.push("El nombre completo es obligatorio.");
  if (!payload.email) errors.push("El email es obligatorio.");
  if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) errors.push("El email no es válido.");
  if (!payload.phone) errors.push("El teléfono es obligatorio.");
  if (!payload.position) errors.push("El puesto es obligatorio.");
  if (!String(form.experience_years).trim()) errors.push("Los años de experiencia son obligatorios.");
  if (!Number.isFinite(payload.experience_years) || payload.experience_years < 0) {
    errors.push("Los años de experiencia deben ser un número igual o mayor que 0.");
  }

  return errors;
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
      />
    </label>
  );
}

export default function NuevoFormularioPage() {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const [createdCandidateId, setCreatedCandidateId] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<string[]>([]);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const canSubmitCreate = useMemo(() => createStatus !== "loading", [createStatus]);
  const canSubmitEdit = useMemo(() => editStatus !== "loading", [editStatus]);

  const updateCreateField = (key: keyof FormState, value: string) => {
    setCreateForm((current) => ({ ...current, [key]: value }));
  };

  const updateEditField = (key: keyof FormState, value: string) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formErrors = validateForm(createForm);
    setCreateErrors(formErrors);

    if (formErrors.length > 0) {
      setCreateStatus("error");
      setCreateFeedback("Corrige los campos marcados antes de enviar.");
      return;
    }

    setCreateStatus("loading");
    setCreateFeedback(null);
    setCreatedCandidateId(null);

    try {
      const payload = normalizePayload(createForm);
      const created = await createRecord(payload);
      setCreateForm(EMPTY_FORM);
      setCreateErrors([]);
      setCreateStatus("success");
      setCreatedCandidateId(created.id);
      setCreateFeedback(`Candidatura creada correctamente (ID: ${created.id}).`);
    } catch (error) {
      setCreateStatus("error");
      setCreateFeedback(error instanceof Error ? error.message : "Error inesperado al crear candidatura.");
    }
  };

  const handleLoadForEdit = async () => {
    if (!editId.trim()) {
      setEditStatus("error");
      setEditFeedback("Debes indicar un ID válido para cargar la candidatura.");
      return;
    }

    setEditStatus("loading");
    setEditFeedback(null);
    setEditErrors([]);

    try {
      const record = await fetchRecordById(editId.trim());

      setEditForm({
        full_name: record.full_name,
        email: record.email,
        phone: record.phone,
        position: record.position,
        linkedin_url: record.linkedin_url ?? "",
        cv_url: record.cv_url ?? "",
        experience_years: String(record.experience_years),
      });

      setEditStatus("success");
      setEditFeedback("Candidatura cargada. Ya puedes editar y guardar.");
    } catch (error) {
      setEditStatus("error");
      setEditFeedback(error instanceof Error ? error.message : "Error inesperado al cargar candidatura.");
    }
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editId.trim()) {
      setEditStatus("error");
      setEditFeedback("Debes indicar un ID válido para editar.");
      return;
    }

    const formErrors = validateForm(editForm);
    setEditErrors(formErrors);

    if (formErrors.length > 0) {
      setEditStatus("error");
      setEditFeedback("Corrige los campos marcados antes de guardar.");
      return;
    }

    setEditStatus("loading");
    setEditFeedback(null);

    try {
      const payload = normalizePayload(editForm);
      const updated = await replaceRecord(editId.trim(), payload);
      setEditStatus("success");
      setEditFeedback(`Candidatura actualizada correctamente (${updated.full_name}).`);
    } catch (error) {
      setEditStatus("error");
      setEditFeedback(error instanceof Error ? error.message : "Error inesperado al actualizar candidatura.");
    }
  };

  const handleDelete = async () => {
    if (!editId.trim()) {
      setDeleteStatus("error");
      setEditFeedback("Debes indicar un ID válido para eliminar.");
      return;
    }

    const shouldDelete = window.confirm(
      `Esta acción eliminará la candidatura con ID ${editId.trim()}. ¿Deseas continuar?`
    );

    if (!shouldDelete) {
      return;
    }

    setDeleteStatus("loading");
    setEditFeedback(null);

    try {
      await deleteRecord(editId.trim());
      setDeleteStatus("success");
      setEditStatus("idle");
      setEditErrors([]);
      setEditForm(EMPTY_FORM);
      setEditFeedback("Candidatura eliminada correctamente.");
    } catch (error) {
      setDeleteStatus("error");
      setEditFeedback(error instanceof Error ? error.message : "Error inesperado al eliminar candidatura.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">TrackFlow Talent Ops</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Gestión de candidaturas
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex w-fit rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Volver al listado
            </Link>
          </div>

          <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setFormMode("create")}
              aria-pressed={formMode === "create"}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                formMode === "create"
                  ? "bg-blue-700 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Nuevo formulario
            </button>
            <button
              type="button"
              onClick={() => setFormMode("edit")}
              aria-pressed={formMode === "edit"}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                formMode === "edit"
                  ? "bg-blue-700 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Editar existente
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4">
          {formMode === "create" ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Registrar nueva candidatura</h2>
            <p className="mt-1 text-sm text-slate-600">Completa los campos requeridos y envía el formulario.</p>

            <form className="mt-4 space-y-3" onSubmit={handleCreate}>
              <Field id="create-full-name" label="Nombre completo" value={createForm.full_name} onChange={(value) => updateCreateField("full_name", value)} required />
              <Field id="create-email" label="Email" type="email" value={createForm.email} onChange={(value) => updateCreateField("email", value)} required />
              <Field id="create-phone" label="Teléfono" value={createForm.phone} onChange={(value) => updateCreateField("phone", value)} required />
              <Field id="create-position" label="Puesto" value={createForm.position} onChange={(value) => updateCreateField("position", value)} required />
              <Field id="create-linkedin" label="LinkedIn (opcional)" value={createForm.linkedin_url} onChange={(value) => updateCreateField("linkedin_url", value)} placeholder="https://linkedin.com/in/..." />
              <Field id="create-cv" label="Enlace CV (opcional)" value={createForm.cv_url} onChange={(value) => updateCreateField("cv_url", value)} placeholder="https://...pdf" />
              <Field id="create-exp" label="Años de experiencia" type="number" value={createForm.experience_years} onChange={(value) => updateCreateField("experience_years", value)} required />

              {createErrors.length > 0 ? (
                <ul className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {createErrors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              ) : null}

              {createFeedback ? (
                <p className={`rounded-md px-3 py-2 text-sm ${createStatus === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-rose-200 bg-rose-50 text-rose-800"}`}>
                  {createFeedback}
                </p>
              ) : null}

              {createStatus === "success" && createdCandidateId ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                  >
                    Ver en listado
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/candidates/${createdCandidateId}`)}
                    className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    Abrir detalle
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmitCreate}
                className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {createStatus === "loading" ? "Guardando..." : "Crear candidatura"}
              </button>
            </form>
          </article>
          ) : null}

          {formMode === "edit" ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Editar candidatura existente</h2>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Field id="edit-id" label="ID de candidatura" value={editId} onChange={setEditId} />
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={handleLoadForEdit}
                  disabled={!canSubmitEdit || deleteStatus === "loading"}
                  className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-70"
                >
                  {editStatus === "loading" ? "Cargando..." : "Cargar"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteStatus === "loading" || editStatus === "loading"}
                  className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-70"
                >
                  {deleteStatus === "loading" ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>

            <form className="mt-3 space-y-3" onSubmit={handleEdit}>
              <Field id="edit-full-name" label="Nombre completo" value={editForm.full_name} onChange={(value) => updateEditField("full_name", value)} required />
              <Field id="edit-email" label="Email" type="email" value={editForm.email} onChange={(value) => updateEditField("email", value)} required />
              <Field id="edit-phone" label="Teléfono" value={editForm.phone} onChange={(value) => updateEditField("phone", value)} required />
              <Field id="edit-position" label="Puesto" value={editForm.position} onChange={(value) => updateEditField("position", value)} required />
              <Field id="edit-linkedin" label="LinkedIn (opcional)" value={editForm.linkedin_url} onChange={(value) => updateEditField("linkedin_url", value)} />
              <Field id="edit-cv" label="Enlace CV (opcional)" value={editForm.cv_url} onChange={(value) => updateEditField("cv_url", value)} />
              <Field id="edit-exp" label="Años de experiencia" type="number" value={editForm.experience_years} onChange={(value) => updateEditField("experience_years", value)} required />

              {editErrors.length > 0 ? (
                <ul className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {editErrors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              ) : null}

              {editFeedback ? (
                <p className={`rounded-md px-3 py-2 text-sm ${editStatus === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-rose-200 bg-rose-50 text-rose-800"}`}>
                  {editFeedback}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmitEdit}
                className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {editStatus === "loading" ? "Guardando..." : "Actualizar candidatura"}
              </button>
            </form>
          </article>
          ) : null}
        </section>
      </section>
    </main>
  );
}
