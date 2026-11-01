import { create } from "zustand";

import { chatApi } from "@/api/chat";
import type { ChatMessage, Source } from "@/types";

type ChatState = {
  paperId: string | null;
  messages: ChatMessage[];
  streaming: boolean;
  load: (paperId: string) => Promise<void>;
  send: (question: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useChatStore = create<ChatState>()((set, get) => ({
  paperId: null,
  messages: [],
  streaming: false,

  load: async (paperId) => {
    set({ paperId, messages: [] });
    const messages = await chatApi.history(paperId);
    if (get().paperId === paperId) set({ messages });
  },

  send: async (question) => {
    const { paperId, streaming } = get();
    if (!paperId || streaming) return;
    const now = new Date().toISOString();
    set((s) => ({
      streaming: true,
      messages: [...s.messages, { role: "user", content: question, sources: [], created_at: now },
        { role: "assistant", content: "", sources: [], created_at: now }],
    }));
    // Update the last (assistant) message in place as events arrive.
    const patch = (fn: (m: ChatMessage) => ChatMessage) =>
      set((s) => ({ messages: [...s.messages.slice(0, -1), fn(s.messages[s.messages.length - 1])] }));
    try {
      for await (const { event, data } of await chatApi.ask(paperId, question)) {
        if (event === "sources") patch((m) => ({ ...m, sources: data as Source[] }));
        else if (event === "token") patch((m) => ({ ...m, content: m.content + (data as string) }));
        else if (event === "error") throw new Error(data as string);
      }
    } catch (e) {
      patch((m) => ({ ...m, content: `⚠️ ${e instanceof Error ? e.message : "Something went wrong"}` }));
    } finally {
      set({ streaming: false });
    }
  },

  clear: async () => {
    const { paperId } = get();
    if (!paperId) return;
    await chatApi.clear(paperId);
    set({ messages: [] });
  },
}));
