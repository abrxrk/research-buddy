"use client";

import { useEffect, useRef } from "react";

/** Calls `fn` every `ms` while `active` is true. */
export function usePolling(fn: () => unknown, active: boolean, ms = 4000) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}
