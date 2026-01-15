import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FolderPlus,
  FileText,
} from "lucide-react";
import { AdminDocumentFolder, useAdminDocumentFolders } from "@/hooks/useAdminDocumentFolders";

const FOLDER_COLORS = [
  { value: "blue", label: "Blå", class: "bg-blue-500" },
  { value: "emerald", label: "Grønn", class: "bg-emerald-500" },
  { value: "amber", label: "Gul", class: "bg-amber-500" },
  { value: "purple", label: "Lilla", class: "bg-purple-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "orange", label: "Oransje", class: "bg-orange-500" },
  { value: "red", label: "Rød", class: "bg-red-500" },
  { value: "gray", label: "Grå", class: "bg-gray-500" },
];

const FOLDER_ICONS = [
  { value: "Folder", label: "Mappe" },
  { value: "Shield", label: "Skjold" },
  { value: "BookOpen", label: "Bok" },
  { value: "Users", label: "Brukere" },
  { value: "AlertTriangle", label: "Advarsel" },
  { value: "ClipboardList", label: "Sjekkliste" },
  { value: "Beaker", label: "Kjemi" },
  { value: "HeartPulse", label: "Helse" },
];

interface DocumentFolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  documentCounts: Record<string, number>;
  moduleType?: "ik-hms" | "ik-mat" | "ik-alkohol" | "ks-bygg";
}

export function DocumentFolderTree({
  selectedFolderId,
  onSelectFolder,
  documentCounts,
  moduleType = "ik-hms",
}: DocumentFolderTreeProps) {
  const { folders, folderTree, createFolder, updateFolder, deleteFolder } = useAdminDocumentFolders(moduleType);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolder, setEditingFolder] = useState<AdminDocumentFolder | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [folderForm, setFolderForm] = useState({
    name: "",
    description: "",
    color: "blue",
    icon: "Folder",
  });

  const toggleExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    createFolder.mutate({
      name: folderForm.name,
      description: folderForm.description || null,
      color: folderForm.color,
      icon: folderForm.icon,
      parent_folder_id: newFolderParentId,
      sort_order: (folders?.length || 0),
      module_type: moduleType,
    });
    setIsCreateDialogOpen(false);
    setFolderForm({ name: "", description: "", color: "blue", icon: "Folder" });
    setNewFolderParentId(null);
  };

  const handleUpdateFolder = () => {
    if (!editingFolder) return;
    updateFolder.mutate({
      id: editingFolder.id,
      name: folderForm.name,
      description: folderForm.description || null,
      color: folderForm.color,
      icon: folderForm.icon,
    });
    setEditingFolder(null);
    setFolderForm({ name: "", description: "", color: "blue", icon: "Folder" });
  };

  const openEditDialog = (folder: AdminDocumentFolder) => {
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      description: folder.description || "",
      color: folder.color,
      icon: folder.icon,
    });
  };

  const openCreateSubfolderDialog = (parentId: string) => {
    setNewFolderParentId(parentId);
    setIsCreateDialogOpen(true);
  };

  const getColorClass = (color: string) => {
    return FOLDER_COLORS.find(c => c.value === color)?.class || "bg-blue-500";
  };

  const renderFolderItem = (
    folder: AdminDocumentFolder & { children?: AdminDocumentFolder[] },
    depth: number = 0
  ) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const docCount = documentCounts[folder.id] || 0;

    return (
      <div key={folder.id}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
                isSelected
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : "hover:bg-muted"
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => onSelectFolder(folder.id)}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
              
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(folder.id);
                  }}
                  className="p-0.5"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}

              <div className={cn("p-1 rounded", getColorClass(folder.color))}>
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-white" />
                ) : (
                  <Folder className="h-4 w-4 text-white" />
                )}
              </div>

              <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>

              {docCount > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {docCount}
                </Badge>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => openEditDialog(folder)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rediger mappe
            </ContextMenuItem>
            <ContextMenuItem onClick={() => openCreateSubfolderDialog(folder.id)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Ny undermappe
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => deleteFolder.mutate(folder.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Slett mappe
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map((child) =>
              renderFolderItem(child as AdminDocumentFolder & { children?: AdminDocumentFolder[] }, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Mapper</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* All documents option */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b",
          selectedFolderId === null
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            : "hover:bg-muted"
        )}
        onClick={() => onSelectFolder(null)}
      >
        <FileText className="h-4 w-4" />
        <span className="text-sm font-medium">Alle dokumenter</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {Object.values(documentCounts).reduce((a, b) => a + b, 0)}
        </Badge>
      </div>

      {/* Folder tree */}
      <div className="flex-1 overflow-auto p-2 space-y-0.5">
        {folderTree.map((folder) => renderFolderItem(folder))}
        
        {folderTree.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Ingen mapper ennå</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Opprett første mappe
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || !!editingFolder}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingFolder(null);
            setNewFolderParentId(null);
            setFolderForm({ name: "", description: "", color: "blue", icon: "Folder" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? "Rediger mappe" : "Ny mappe"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mappenavn</Label>
              <Input
                value={folderForm.name}
                onChange={(e) => setFolderForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="F.eks. HMS-dokumenter"
              />
            </div>
            <div className="space-y-2">
              <Label>Beskrivelse (valgfritt)</Label>
              <Input
                value={folderForm.description}
                onChange={(e) => setFolderForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Kort beskrivelse av mappen"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Farge</Label>
                <Select
                  value={folderForm.color}
                  onValueChange={(v) => setFolderForm((f) => ({ ...f, color: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDER_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-4 h-4 rounded", c.class)} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ikon</Label>
                <Select
                  value={folderForm.icon}
                  onValueChange={(v) => setFolderForm((f) => ({ ...f, icon: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDER_ICONS.map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingFolder(null);
              }}
            >
              Avbryt
            </Button>
            <Button
              onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
              disabled={!folderForm.name.trim()}
            >
              {editingFolder ? "Lagre" : "Opprett"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
