import { api } from "@/api/client";
import type { Comparison } from "@/types";

export const MAX_COMPARE = 5;

export const comparisonsApi = {
  list: () => api<Comparison[]>("/comparisons"),
  get: (id: string) => api<Comparison>(`/comparisons/${id}`),
  create: (paper_ids: string[]) => api<Comparison>("/comparisons", { method: "POST", body: JSON.stringify({ paper_ids }) }),
  remove: (id: string) => api<void>(`/comparisons/${id}`, { method: "DELETE" }),
  retry: (id: string) => api<Comparison>(`/comparisons/${id}/retry`, { method: "POST" }),
};
