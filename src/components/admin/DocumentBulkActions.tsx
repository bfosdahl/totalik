import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FolderInput,
  Trash2,
  MoreHorizontal,
  Download,
  X,
  CheckSquare,
} from "lucide-react";
import { AdminDocumentFolder } from "@/hooks/useAdminDocumentFolders";
import { t } from "@/i18n/t";

interface DocumentBulkActionsProps {
  selectedCount: number;
  folders: AdminDocumentFolder[];
  onMove: (folderId: string | null) => void;
  onDelete: () => void;
  onDownload: () => void;
  onClearSelection: () => void;
}

export function DocumentBulkActions({
  selectedCount,
  folders,
  onMove,
  onDelete,
  onDownload,
  onClearSelection,
}: DocumentBulkActionsProps) {
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-xl rounded-xl px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-emerald-500" />
          <span className="font-medium">
            {selectedCount} valgt
          </span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMoveDialogOpen(true)}
          >
            <FolderInput className="h-4 w-4 mr-1" />
            Flytt
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            Last ned
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("auto.slett")}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Move Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flytt {selectedCount} dokument{selectedCount > 1 ? "er" : ""}</DialogTitle>
            <DialogDescription>
              {t("auto.velg_mappen_du_vil_flytte_dokumentene_ti")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auto.velg_mappe")}</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder={t("auto.velg_mappe")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("auto.ingen_mappe_rot")}</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button
              onClick={() => {
                onMove(selectedFolder === "none" ? null : selectedFolder);
                setIsMoveDialogOpen(false);
                setSelectedFolder("");
              }}
              disabled={!selectedFolder}
            >
              Flytt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett {selectedCount} dokument{selectedCount > 1 ? "er" : ""}?</DialogTitle>
            <DialogDescription>
              {t("auto.denne_handlingen_kan_ikke_angres_dokumen")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete();
                setIsDeleteDialogOpen(false);
              }}
            >
              {t("auto.slett_permanent")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
