import { NewTimeEntryDialog } from "@/components/timeregistration/NewTimeEntryDialog";
import { CreateTimeEntry } from "@/hooks/useTimeEntries";

interface Ks2NewTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: CreateTimeEntry) => Promise<boolean>;
  projectId: string;
  projectName: string;
}

/**
 * Project-scoped wrapper around the full-featured NewTimeEntryDialog.
 * The KS project is pre-selected and locked, but kunde, timetype and
 * tillegg-felter work identically to the global timeføring-dialog.
 */
export function Ks2NewTimeEntryDialog({
  open,
  onOpenChange,
  onSubmit,
  projectId,
}: Ks2NewTimeEntryDialogProps) {
  return (
    <NewTimeEntryDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      defaultProjectId={projectId}
    />
  );
}
