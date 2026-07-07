export type CandidateRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: string;
  stage: string;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
};

export type RecordsResponse = {
  total: number;
  page: number;
  limit: number;
  data: CandidateRecord[];
};

export type Note = {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
};

export type NotesResponse =
  | Note[]
  | {
      data?: Note[];
    };

export type RecordPayload = {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
};

export type RecordPatchPayload = {
  status?: string;
  stage?: string;
};
