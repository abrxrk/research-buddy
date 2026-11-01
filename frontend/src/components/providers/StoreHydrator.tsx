"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";

/** Loads persisted stores from localStorage once the app has mounted. */
export function StoreHydrator() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);
  return null;
}
