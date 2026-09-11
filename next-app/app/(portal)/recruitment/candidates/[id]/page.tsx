"use client";

import { useParams } from "next/navigation";
import { CandidateProfile } from "@/components/candidate-profile";

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  return <CandidateProfile candidateId={params.id} />;
}
