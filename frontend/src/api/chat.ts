import { api, apiFetch } from "@/api/client";
import { readSSE } from "@/helpers/sse";
import type { ChatMessage } from "@/types";

export const chatApi = {
  history: (paperId: string) => api<ChatMessage[]>(`/papers/${paperId}/chat`),
  clear: (paperId: string) => api<void>(`/papers/${paperId}/chat`, { method: "DELETE" }),
  /** Streams events: sources -> token* -> done | error */
  ask: async (paperId: string, question: string, signal?: AbortSignal) => {
    const res = await apiFetch(`/papers/${paperId}/chat`, { method: "POST", body: JSON.stringify({ question }), signal });
    return readSSE(res.body!);
  },
};
