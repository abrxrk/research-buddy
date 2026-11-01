import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, isProcessing } from "@/helpers/format";
import type { PaperStatus } from "@/types";

export function StatusBadge({ status }: { status: PaperStatus }) {
  if (status === "ready")
    return <Badge className="bg-emerald-50 text-emerald-700"><CheckCircle2 /> Ready</Badge>;
  if (status === "failed") return <Badge variant="destructive"><XCircle /> Failed</Badge>;
  return (
    <Badge className="bg-indigo-50 text-indigo-700">
      {isProcessing(status) && <Loader2 className="animate-spin" />} {STATUS_LABEL[status]}
    </Badge>
  );
}
