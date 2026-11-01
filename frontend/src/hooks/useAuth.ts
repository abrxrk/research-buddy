"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";

/** Current user. With `required`, redirects to /auth when logged out. */
export function useAuth({ required = false } = {}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = !useAuthStore((s) => s.hydrated);
  const clear = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (required && !loading && !user) router.replace("/auth");
  }, [required, loading, user, router]);

  const logout = () => {
    clear();
    router.replace("/auth");
  };

  return { user, loading, logout };
}
