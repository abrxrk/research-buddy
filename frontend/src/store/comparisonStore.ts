import { create } from "zustand";

import { comparisonsApi } from "@/api/comparisons";
import type { Comparison } from "@/types";

/** Saved comparisons, shared by the sidebar and the pages that create or delete them. */
type ComparisonState = {
  comparisons: Comparison[];
  loaded: boolean; // false until the first list fetch (sidebar skeleton)
  fetchComparisons: () => Promise<void>;
  create: (paperIds: string[]) => Promise<Comparison>;
  remove: (id: string) => Promise<void>;
};

export const useComparisonStore = create<ComparisonState>()((set) => ({
  comparisons: [],
  loaded: false,
  fetchComparisons: async () => set({ comparisons: await comparisonsApi.list(), loaded: true }),
  create: async (paperIds) => {
    const c = await comparisonsApi.create(paperIds);
    set((s) => ({ comparisons: [c, ...s.comparisons] }));
    return c;
  },
  remove: async (id) => {
    await comparisonsApi.remove(id);
    set((s) => ({ comparisons: s.comparisons.filter((c) => c.id !== id) }));
  },
}));
