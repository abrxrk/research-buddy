import { Suspense } from "react";

import { PaperWorkspace } from "@/components/paper/PaperWorkspace";

// The workspace reads the paper id from the URL, which can't be part of the static shell.
export default function PaperPage() {
  return (
    <Suspense>
      <PaperWorkspace />
    </Suspense>
  );
}
