import { create } from "zustand";

import { papersApi } from "@/api/papers";
import type { Paper } from "@/types";

type PaperState = {
  papers: Paper[];
  current: Paper | null;
  loading: boolean;
  fetchPapers: () => Promise<void>;
  fetchPaper: (id: string) => Promise<void>;
  addFromLink: (url: string) => Promise<Paper>;
  upload: (file: File) => Promise<Paper>;
  remove: (id: string) => Promise<void>;
};

export const usePaperStore = create<PaperState>()((set) => ({
  papers: [],
  current: null,
  loading: true,
  fetchPapers: async () => {
    const papers = await papersApi.list();
    set({ papers, loading: false });
  },
  fetchPaper: async (id) => {
    const paper = await papersApi.get(id);
    set({ current: paper });
  },
  addFromLink: async (url) => {
    const paper = await papersApi.fromLink(url);
    set((s) => ({ papers: [paper, ...s.papers] }));
    return paper;
  },
  upload: async (file) => {
    const paper = await papersApi.upload(file);
    set((s) => ({ papers: [paper, ...s.papers] }));
    return paper;
  },
  remove: async (id) => {
    await papersApi.remove(id);
    set((s) => ({ papers: s.papers.filter((p) => p.id !== id) }));
  },
}));
