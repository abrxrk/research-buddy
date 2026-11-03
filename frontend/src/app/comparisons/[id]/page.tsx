import { Suspense } from "react";

import { ComparisonWorkspace } from "@/components/comparison/ComparisonWorkspace";

// Reads the comparison id from the URL, which can't be part of the static shell.
export default function ComparisonPage() {
  return (
    <Suspense>
      <ComparisonWorkspace />
    </Suspense>
  );
}
