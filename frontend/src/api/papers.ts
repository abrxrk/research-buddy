import { api, apiFetch } from "@/api/client";
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
  retry: (id: string) => api<Paper>(`/papers/${id}/retry`, { method: "POST" }),
  /** PDFs need the auth header, so fetch as a blob and open it from a local object URL. */
  openPdf: async (id: string) => {
    const tab = window.open("", "_blank"); // open synchronously so popup blockers allow it
    const blob = await (await apiFetch(`/papers/${id}/pdf`)).blob();
    const url = URL.createObjectURL(blob);
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
