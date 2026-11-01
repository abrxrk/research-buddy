import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "@/types";

type AuthState = {
  token: string | null;
  user: User | null;
  hydrated: boolean; // false until the session is loaded from localStorage
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "rb-auth",
      partialize: ({ token, user }) => ({ token, user }),
      // Rehydrated manually after mount (StoreHydrator) so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => () => useAuthStore.setState({ hydrated: true }),
    },
  ),
);
