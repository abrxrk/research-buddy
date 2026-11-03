import type { Metadata } from "next";
import { Suspense } from "react";

import { PaperWorkspace } from "@/components/paper/PaperWorkspace";

// Placeholder until the client sets the real title (see useDocumentTitle in PaperWorkspace).
export const metadata: Metadata = { title: "Paper" };

// The workspace reads the paper id from the URL, which can't be part of the static shell.
export default function PaperPage() {
  return (
    <Suspense>
      <PaperWorkspace />
    </Suspense>
  );
}
