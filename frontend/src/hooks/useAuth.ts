"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";

/** Current user. With `required`, protects the page: signing out goes to the landing page, an expired session to /auth. */
export function useAuth({ required = false } = {}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = !useAuthStore((s) => s.hydrated);
  const signedOut = useAuthStore((s) => s.signedOut);
  const clear = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (required && !loading && !user) router.replace(signedOut ? "/" : "/auth");
  }, [required, loading, user, signedOut, router]);

  const logout = () => {
    clear();
    router.replace("/");
  };

  return { user, loading, logout };
}
