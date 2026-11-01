import { api } from "@/api/client";
import type { Paper } from "@/types";

export const papersApi = {
  list: () => api<Paper[]>("/papers"),
  get: (id: string) => api<Paper>(`/papers/${id}`),
  fromLink: (url: string) => api<Paper>("/papers/link", { method: "POST", body: JSON.stringify({ url }) }),
  upload: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api<Paper>("/papers/upload", { method: "POST", body });
  },
  remove: (id: string) => api<void>(`/papers/${id}`, { method: "DELETE" }),
};
