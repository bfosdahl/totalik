import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FlaskConical,
  Plus,
  Search,
  FileText,
  Trash2,
  Edit,
  Upload,
  Building2,
  AlertTriangle,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { useAllGlobalChemicals, useAdminGlobalChemicals, type GlobalChemicalWithStats } from "@/hooks/useAdminGlobalChemicals";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const DANGER_CLASS_OPTIONS = [
  { value: "H200", label: "H200 - Ustabil eksplosiv" },
  { value: "H220", label: "H220 - Ekstremt brannfarlig gass" },
  { value: "H225", label: "H225 - Meget brannfarlig væske og damp" },
  { value: "H226", label: "H226 - Brannfarlig væske og damp" },
  { value: "H300", label: "H300 - Dødelig ved svelging" },
  { value: "H301", label: "H301 - Giftig ved svelging" },
  { value: "H302", label: "H302 - Skadelig ved svelging" },
  { value: "H310", label: "H310 - Dødelig ved hudkontakt" },
  { value: "H311", label: "H311 - Giftig ved hudkontakt" },
  { value: "H312", label: "H312 - Skadelig ved hudkontakt" },
  { value: "H314", label: "H314 - Gir alvorlige etseskader" },
  { value: "H315", label: "H315 - Irriterer huden" },
  { value: "H317", label: "H317 - Kan utløse allergisk hudreaksjon" },
  { value: "H318", label: "H318 - Gir alvorlig øyeskade" },
  { value: "H319", label: "H319 - Gir alvorlig øyeirritasjon" },
  { value: "H330", label: "H330 - Dødelig ved innånding" },
  { value: "H331", label: "H331 - Giftig ved innånding" },
  { value: "H332", label: "H332 - Skadelig ved innånding" },
  { value: "H334", label: "H334 - Kan gi allergi/astma ved innånding" },
  { value: "H335", label: "H335 - Kan forårsake irritasjon av luftveiene" },
  { value: "H340", label: "H340 - Kan forårsake genetiske skader" },
  { value: "H350", label: "H350 - Kan forårsake kreft" },
  { value: "H360", label: "H360 - Kan skade fruktbarheten" },
  { value: "H400", label: "H400 - Meget giftig for liv i vann" },
  { value: "H410", label: "H410 - Langtidsvirkning for vannlevende org." },
];

export default function AdminStoffkartotek() {
  const { data: chemicals, isLoading } = useAllGlobalChemicals();
  const {
    createChemical,
    updateChemical,
    deleteChemical,
    uploadSdsVersion,
    getSdsDownloadUrl,
    isCreating,
    isUpdating,
    isDeleting,
    isUploading,
  } = useAdminGlobalChemicals();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState<GlobalChemicalWithStats | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    productName: "",
    manufacturer: "",
    casNumber: "",
    dangerClasses: [] as string[],
    notes: "",
  });
  const [sdsFile, setSdsFile] = useState<File | null>(null);

  // Filter chemicals
  const filteredChemicals = chemicals?.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.product_name.toLowerCase().includes(q) ||
      c.manufacturer?.toLowerCase().includes(q) ||
      c.cas_number?.toLowerCase().includes(q)
    );
  });

  // Stats
  const totalChemicals = chemicals?.length || 0;
  const withSds = chemicals?.filter((c) => c.current_sds).length || 0;
  const withoutSds = totalChemicals - withSds;
  const totalUsage = chemicals?.reduce((acc, c) => acc + (c.company_count || 0), 0) || 0;

  const resetForm = () => {
    setFormData({
      productName: "",
      manufacturer: "",
      casNumber: "",
      dangerClasses: [],
      notes: "",
    });
    setSdsFile(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (chemical: GlobalChemicalWithStats) => {
    setSelectedChemical(chemical);
    setFormData({
      productName: chemical.product_name,
      manufacturer: chemical.manufacturer || "",
      casNumber: chemical.cas_number || "",
      dangerClasses: chemical.danger_classes || [],
      notes: chemical.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (chemical: GlobalChemicalWithStats) => {
    setSelectedChemical(chemical);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenUpload = (chemical: GlobalChemicalWithStats) => {
    setSelectedChemical(chemical);
    setSdsFile(null);
    setIsUploadDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formData.productName.trim()) return;
    createChemical({
      productName: formData.productName.trim(),
      manufacturer: formData.manufacturer.trim() || undefined,
      casNumber: formData.casNumber.trim() || undefined,
      dangerClasses: formData.dangerClasses,
      notes: formData.notes.trim() || undefined,
      sdsFile: sdsFile || undefined,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        resetForm();
      },
    });
  };

  const handleUpdate = () => {
    if (!selectedChemical || !formData.productName.trim()) return;
    updateChemical({
      id: selectedChemical.id,
      productName: formData.productName.trim(),
      manufacturer: formData.manufacturer.trim() || undefined,
      casNumber: formData.casNumber.trim() || undefined,
      dangerClasses: formData.dangerClasses,
      notes: formData.notes.trim() || undefined,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedChemical(null);
        resetForm();
      },
    });
  };

  const handleDelete = () => {
    if (!selectedChemical) return;
    deleteChemical(selectedChemical.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedChemical(null);
      },
    });
  };

  const handleUploadSds = () => {
    if (!selectedChemical || !sdsFile) return;
    uploadSdsVersion({
      chemicalId: selectedChemical.id,
      sdsFile,
    }, {
      onSuccess: () => {
        setIsUploadDialogOpen(false);
        setSelectedChemical(null);
        setSdsFile(null);
      },
    });
  };

  const handleDownloadSds = async (sdsFilePath: string) => {
    const url = await getSdsDownloadUrl(sdsFilePath);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const toggleDangerClass = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      dangerClasses: prev.dangerClasses.includes(value)
        ? prev.dangerClasses.filter((c) => c !== value)
        : [...prev.dangerClasses, value],
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <FlaskConical className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Globalt Stoffkartotek</h1>
              <p className="text-muted-foreground">
                Administrer det felles kjemikalieregisteret
              </p>
            </div>
          </div>
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Legg til kjemikalie
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FlaskConical className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totalt stoffer</p>
                  <p className="text-2xl font-bold">{totalChemicals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Med SDS</p>
                  <p className="text-2xl font-bold">{withSds}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uten SDS</p>
                  <p className="text-2xl font-bold">{withoutSds}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bedriftsbruk</p>
                  <p className="text-2xl font-bold">{totalUsage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter produktnavn, produsent eller CAS-nr..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredChemicals?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "Ingen kjemikalier funnet" : "Ingen kjemikalier registrert ennå"}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produktnavn</TableHead>
                      <TableHead>Produsent</TableHead>
                      <TableHead>CAS-nr</TableHead>
                      <TableHead>Fareklasser</TableHead>
                      <TableHead>SDS</TableHead>
                      <TableHead className="text-center">Bedrifter</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChemicals.map((chemical) => (
                      <TableRow key={chemical.id}>
                        <TableCell className="font-medium">
                          {chemical.product_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {chemical.manufacturer || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {chemical.cas_number || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {chemical.danger_classes?.slice(0, 3).map((dc) => (
                              <Badge
                                key={dc}
                                variant="secondary"
                                className="text-xs"
                              >
                                {dc}
                              </Badge>
                            ))}
                            {(chemical.danger_classes?.length || 0) > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(chemical.danger_classes?.length || 0) - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {chemical.current_sds ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-success"
                              onClick={() =>
                                handleDownloadSds(chemical.current_sds!.sds_file_path)
                              }
                            >
                              <Download className="w-3 h-3" />
                              v{chemical.current_sds.version_number}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-warning">
                              Mangler
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {chemical.company_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenUpload(chemical)}
                              title="Last opp ny SDS"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(chemical)}
                              title="Rediger"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleOpenDelete(chemical)}
                              title="Slett"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Legg til nytt kjemikalie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Produktnavn *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, productName: e.target.value }))
                  }
                  placeholder="F.eks. Acetone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Produsent</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))
                  }
                  placeholder="F.eks. BASF"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="casNumber">CAS-nummer</Label>
              <Input
                id="casNumber"
                value={formData.casNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, casNumber: e.target.value }))
                }
                placeholder="F.eks. 67-64-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Fareklasser (H-setninger)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {DANGER_CLASS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.dangerClasses.includes(option.value)}
                      onChange={() => toggleDangerClass(option.value)}
                      className="rounded"
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notater</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Eventuelle merknader..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdsFile">Sikkerhetsdatablad (SDS)</Label>
              <Input
                id="sdsFile"
                type="file"
                accept=".pdf"
                onChange={(e) => setSdsFile(e.target.files?.[0] || null)}
              />
              {sdsFile && (
                <p className="text-sm text-muted-foreground">
                  Valgt fil: {sdsFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.productName.trim() || isCreating}
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rediger kjemikalie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editProductName">Produktnavn *</Label>
                <Input
                  id="editProductName"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, productName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editManufacturer">Produsent</Label>
                <Input
                  id="editManufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCasNumber">CAS-nummer</Label>
              <Input
                id="editCasNumber"
                value={formData.casNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, casNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fareklasser (H-setninger)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {DANGER_CLASS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.dangerClasses.includes(option.value)}
                      onChange={() => toggleDangerClass(option.value)}
                      className="rounded"
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Notater</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.productName.trim() || isUpdating}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload SDS Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Last opp ny SDS-versjon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Laster opp ny SDS for: <strong>{selectedChemical?.product_name}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="uploadSdsFile">Sikkerhetsdatablad (PDF)</Label>
              <Input
                id="uploadSdsFile"
                type="file"
                accept=".pdf"
                onChange={(e) => setSdsFile(e.target.files?.[0] || null)}
              />
              {sdsFile && (
                <p className="text-sm text-muted-foreground">
                  Valgt fil: {sdsFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleUploadSds} disabled={!sdsFile || isUploading}>
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Last opp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett kjemikalie?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette{" "}
              <strong>{selectedChemical?.product_name}</strong>? Dette vil også fjerne
              kjemikaliet fra alle bedrifter som bruker det.
              {(selectedChemical?.company_count || 0) > 0 && (
                <span className="block mt-2 text-warning">
                  ⚠️ Dette kjemikaliet er i bruk av {selectedChemical?.company_count}{" "}
                  bedrifter.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
