import { fetchRecords } from "@/services/candidates";
import type { CandidateRecord } from "@/types/candidates";

import CandidatesListView from "./components/candidates-list-view";

type HomeProps = {
  searchParams: Promise<{
    status?: string;
    stage?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { status, stage } = await searchParams;

  let records: CandidateRecord[] = [];
  let fetchError: string | null = null;

  try {
    const response = await fetchRecords({ status, stage });
    records = response.data;
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Error inesperado";
  }

  return <CandidatesListView initialRecords={records} fetchError={fetchError} />;
}
