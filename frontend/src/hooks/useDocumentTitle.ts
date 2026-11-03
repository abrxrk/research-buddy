"use client";

import { useEffect } from "react";

/** Sets document.title to "{title} · Research Buddy" (or just the app name when empty). Restores nothing on unmount. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · Research Buddy` : "Research Buddy";
  }, [title]);
}
