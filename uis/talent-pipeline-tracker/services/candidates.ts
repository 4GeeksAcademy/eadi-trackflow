import type {
  CandidateRecord,
  Note,
  NotesResponse,
  RecordsResponse,
  RecordPatchPayload,
  RecordPayload,
} from "@/types/candidates";

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("Falta NEXT_PUBLIC_API_URL en el entorno.");
  }

  return baseUrl;
}

export function normalizeNotesResponse(payload: NotesResponse): Note[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export async function fetchRecords(params?: {
  status?: string;
  stage?: string;
  limit?: number;
  page?: number;
}): Promise<RecordsResponse> {
  const baseUrl = getBaseUrl();
  const query = new URLSearchParams({
    limit: String(params?.limit ?? 1000),
    page: String(params?.page ?? 1),
  });

  if (params?.status) {
    query.set("status", params.status);
  }

  if (params?.stage) {
    query.set("stage", params.stage);
  }

  const response = await fetch(`${baseUrl}/records?${query.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Error al cargar candidaturas (${response.status}).`);
  }

  return (await response.json()) as RecordsResponse;
}

export async function fetchRecordById(id: string): Promise<CandidateRecord> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/records/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar la candidatura (${response.status}).`);
  }

  return (await response.json()) as CandidateRecord;
}

export async function fetchNotesByRecordId(id: string): Promise<Note[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/records/${id}/notes`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudieron cargar las notas (${response.status}).`);
  }

  const payload = (await response.json()) as NotesResponse;
  return normalizeNotesResponse(payload);
}

export async function patchRecord(id: string, payload: RecordPatchPayload): Promise<CandidateRecord> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`No se pudo actualizar la candidatura (${response.status}).`);
  }

  return (await response.json()) as CandidateRecord;
}

export async function createRecord(payload: RecordPayload): Promise<CandidateRecord> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`No se pudo crear la candidatura (${response.status}).`);
  }

  return (await response.json()) as CandidateRecord;
}

export async function replaceRecord(id: string, payload: RecordPayload): Promise<CandidateRecord> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`No se pudo actualizar la candidatura (${response.status}).`);
  }

  return (await response.json()) as CandidateRecord;
}

export async function deleteRecord(id: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/records/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`No se pudo eliminar la candidatura (${response.status}).`);
  }
}

export async function createNote(recordId: string, content: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/records/${recordId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`No se pudo crear la nota (${response.status}).`);
  }
}

export async function removeNote(recordId: string, noteId: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/records/${recordId}/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`No se pudo eliminar la nota (${response.status}).`);
  }
}
