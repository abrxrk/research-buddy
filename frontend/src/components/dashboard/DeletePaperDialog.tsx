"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

export function DeletePaperDialog({ paper, onClose }: { paper: Paper | null; onClose: () => void }) {
  const remove = usePaperStore((s) => s.remove);
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    if (!paper) return;
    setDeleting(true);
    try {
      await remove(paper.id);
      toast.success("Paper deleted");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={!!paper} onOpenChange={(open) => !open && !deleting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this paper?</DialogTitle>
          <DialogDescription>
            <span className="text-foreground">“{paper?.title}”</span> will be removed along with its insights, search index and chat history. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
