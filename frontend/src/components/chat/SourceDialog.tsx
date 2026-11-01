"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Source } from "@/types";

export function SourceDialog({ source, onClose }: { source: Source | null; onClose: () => void }) {
  return (
    <Dialog open={!!source} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        {source && (
          <>
            <DialogHeader>
              <DialogTitle>Source [{source.n}] · Page {source.pages}</DialogTitle>
              <DialogDescription>{source.section || "No section heading"}</DialogDescription>
            </DialogHeader>
            <p className="whitespace-pre-line text-sm leading-relaxed">{source.text}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
