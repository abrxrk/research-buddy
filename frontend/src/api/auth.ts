import { api } from "@/api/client";
import type { AuthResponse, User } from "@/types";

export const authApi = {
  signup: (email: string, password: string, name?: string) =>
    api<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, name: name || null }) }),
  login: (email: string, password: string) =>
    api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api<User>("/auth/me"),
};
