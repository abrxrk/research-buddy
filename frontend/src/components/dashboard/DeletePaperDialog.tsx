"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { absoluteDate, plural } from "@/helpers/format";
import { sourceInfo } from "@/helpers/source";
import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

type Props = {
  paper: Paper | null;
  onClose: () => void;
  /** Where to put focus after a successful delete (the row that had it is gone). */
  focusAfterDelete?: () => HTMLElement | null | undefined;
};

export function DeletePaperDialog({ paper, onClose, focusAfterDelete }: Props) {
  const remove = usePaperStore((s) => s.remove);
  const [deleting, setDeleting] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const deleted = useRef(false);
  useEffect(() => {
    if (paper) deleted.current = false;
  }, [paper]);
  // keep the last paper while the dialog fades out, so the title doesn't blank mid-animation
  const [p, setShown] = useState(paper);
  if (paper && paper !== p) setShown(paper);

  async function confirm() {
    if (!paper) return;
    setDeleting(true);
    try {
      await remove(paper.id);
      deleted.current = true;
      toast.success("Paper deleted", { description: paper.title });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={!!paper}
      onOpenChange={(open) => !open && !deleting && onClose()}
    >
      <DialogContent
        className="sm:max-w-md"
        initialFocus={cancel}
        finalFocus={() => (deleted.current ? (focusAfterDelete?.() ?? false) : true)}
      >
        <DialogHeader>
          <DialogTitle>Delete this paper?</DialogTitle>
          <DialogDescription>
            <span className="line-clamp-2 text-foreground">“{p?.title}”</span>
            {p && (
              <span className="mt-1 block text-xs">
                {sourceInfo(p.source).label}
                {p.page_count ? ` · ${plural(p.page_count, "page")}` : ""} · added {absoluteDate(p.created_at)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          <p>This also removes everything made from it:</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            <li>the summary, findings and concept map</li>
            <li>the search index used to answer questions</li>
            <li>its chat history</li>
          </ul>
          <p className="mt-2">This can&apos;t be undone.</p>
        </div>
        <DialogFooter>
          <Button ref={cancel} variant="outline" onClick={onClose} disabled={deleting}>
            Cancel <Kbd combo="escape" className="-mr-1" />
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={deleting} aria-busy={deleting}>
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
