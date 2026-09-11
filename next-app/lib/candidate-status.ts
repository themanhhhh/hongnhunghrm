export const CANDIDATE_STATUS_OPTIONS = [
  { value: "tiếp nhận hồ sơ", label: "Tiếp nhận hồ sơ" },
  { value: "đã sơ loại", label: "Đã sơ loại" },
  { value: "đã tạo lịch", label: "Đã tạo lịch" },
  { value: "đã phỏng vấn", label: "Đã phỏng vấn" },
  { value: "đã quyết định loại", label: "Đã quyết định loại" },
  { value: "đã quyết định tuyển", label: "Đã quyết định tuyển" },
  { value: "đi làm", label: "Đi làm" },
] as const;

export function normalizeCandidateStatus(value: unknown) {
  const status = String(value ?? "").trim();
  const normalized = status.toLocaleLowerCase();

  if (["new", "submitted", "s1: mới", "đã tiếp nhận hồ sơ", "tiếp nhận hồ sơ"].includes(normalized)) return "tiếp nhận hồ sơ";
  if (["screened", "đã sơ loại", "đã sơ loại, đạt", "đã sơ loại, không đạt"].includes(normalized)) return "đã sơ loại";
  if (["đã tạo lịch", "interviewing"].includes(normalized)) return "đã tạo lịch";
  if (["interviewed", "s2: phỏng vấn", "đã phỏng vấn", "đã phỏng vấn, đạt", "đã phỏng vấn, không đạt"].includes(normalized)) return "đã phỏng vấn";
  if (["s7: loại", "rejected", "offer_rejected", "loại", "đã quyết định loại"].includes(normalized)) return "đã quyết định loại";
  if (["s5: trúng tuyển", "passed", "đạt", "offer_accepted", "đã quyết định tuyển"].includes(normalized)) return "đã quyết định tuyển";
  if (["hired", "đã chuyển thành nhân viên", "đã chuyển nhân viên", "đi làm"].includes(normalized)) return "đi làm";
  return status || "tiếp nhận hồ sơ";
}

export function isCandidateWorking(value: unknown) {
  return normalizeCandidateStatus(value) === "đi làm";
}

export function isCandidateHiringDecisionPassed(value: unknown) {
  return normalizeCandidateStatus(value) === "đã quyết định tuyển";
}
