import { toast } from "sonner";
import { create } from "zustand";

import { chatApi } from "@/api/chat";
import type { ChatMessage, Source } from "@/types";

type ChatState = {
  chatPath: string | null;
  messages: ChatMessage[];
  /** History is being fetched for the current chatPath. */
  loading: boolean;
  streaming: boolean;
  /** The last question failed; its text is kept so it can be retried. */
  error: { message: string; question: string } | null;
  /** The user pressed Stop while the last answer was still being written. */
  interrupted: boolean;
  load: (chatPath: string) => Promise<void>;
  send: (question: string) => Promise<void>;
  stop: () => void;
  retry: () => void;
  clear: () => Promise<void>;
};

let controller: AbortController | null = null;

export const useChatStore = create<ChatState>()((set, get) => ({
  chatPath: null,
  messages: [],
  loading: false,
  streaming: false,
  error: null,
  interrupted: false,

  load: async (chatPath) => {
    get().stop();
    set({ chatPath, messages: [], loading: true, error: null, interrupted: false });
    try {
      const messages = await chatApi.history(chatPath);
      if (get().chatPath === chatPath) set({ messages });
    } catch {
      // question: "" marks a load failure; retry() reloads instead of re-asking.
      if (get().chatPath === chatPath) set({ error: { message: "Couldn't load earlier messages", question: "" } });
    } finally {
      if (get().chatPath === chatPath) set({ loading: false });
    }
  },

  send: async (question) => {
    const { chatPath, streaming } = get();
    if (!chatPath || streaming) return;
    const now = new Date().toISOString();
    controller = new AbortController();
    set((s) => ({
      streaming: true,
      error: null,
      interrupted: false,
      messages: [...s.messages, { role: "user", content: question, sources: [], created_at: now },
        { role: "assistant", content: "", sources: [], created_at: now }],
    }));
    // Update the last (assistant) message in place as events arrive.
    const patch = (fn: (m: ChatMessage) => ChatMessage) =>
      set((s) => ({ messages: [...s.messages.slice(0, -1), fn(s.messages[s.messages.length - 1])] }));
    try {
      for await (const { event, data } of await chatApi.ask(chatPath, question, controller.signal)) {
        if (event === "sources") patch((m) => ({ ...m, sources: data as Source[] }));
        else if (event === "token") patch((m) => ({ ...m, content: m.content + (data as string) }));
        else if (event === "error") throw new Error(data as string);
      }
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === "AbortError";
      const last = get().messages.at(-1);
      // An assistant message with nothing in it is just noise; drop it and show the error / stop state instead.
      if (last?.role === "assistant" && !last.content) set((s) => ({ messages: s.messages.slice(0, -1) }));
      if (aborted) set({ interrupted: !!last?.content });
      else set({ error: { message: e instanceof Error ? e.message : "Something went wrong", question } });
    } finally {
      controller = null;
      // Stamp the answer with when it finished, not when the question was sent.
      set((s) => {
        const last = s.messages.at(-1);
        const done = last?.role === "assistant" && last.content ? { ...last, created_at: new Date().toISOString() } : null;
        return { streaming: false, messages: done ? [...s.messages.slice(0, -1), done] : s.messages };
      });
    }
  },

  stop: () => controller?.abort(),

  retry: () => {
    const { error, chatPath } = get();
    if (!error || !chatPath) return;
    if (!error.question) {
      get().load(chatPath);
      return;
    }
    // Drop the failed question and any partial answer after it, then send it again.
    set((s) => {
      const i = s.messages.findLastIndex((m) => m.role === "user");
      return i < 0 ? s : { messages: s.messages.slice(0, i) };
    });
    get().send(error.question);
  },

  clear: async () => {
    const { chatPath, messages } = get();
    if (!chatPath) return;
    set({ messages: [], error: null, interrupted: false }); // optimistic
    try {
      await chatApi.clear(chatPath);
    } catch {
      if (get().chatPath === chatPath) set({ messages });
      toast.error("Couldn't clear the chat");
    }
  },
}));
