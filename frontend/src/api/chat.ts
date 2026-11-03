import { api, apiFetch } from "@/api/client";
import { readSSE } from "@/helpers/sse";
import type { ChatMessage } from "@/types";

/** chatPath: /papers/:id/chat, /library/chat or /comparisons/:id/chat (same API shape for all three). */
export const chatApi = {
  history: (chatPath: string) => api<ChatMessage[]>(chatPath),
  clear: (chatPath: string) => api<void>(chatPath, { method: "DELETE" }),
  /** Streams events: sources -> token* -> done | error */
  ask: async (chatPath: string, question: string, signal?: AbortSignal) => {
    const res = await apiFetch(chatPath, { method: "POST", body: JSON.stringify({ question }), signal });
    return readSSE(res.body!);
  },
};
