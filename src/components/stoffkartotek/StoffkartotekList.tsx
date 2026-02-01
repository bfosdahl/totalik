import { useState } from "react";
import { 
  FlaskConical, 
  Building2, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  Trash2, 
  Edit2, 
  Download,
  MoreVertical,
  Search,
  Plus,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useCompanyChemicals, 
  useGlobalChemicalRegistry,
  CompanyChemicalEntry 
} from "@/hooks/useGlobalChemicalRegistry";
import { AddChemicalDialog } from "./AddChemicalDialog";
import { EditChemicalEntryDialog } from "./EditChemicalEntryDialog";
import { ChemicalRiskAssessmentDialog } from "./ChemicalRiskAssessmentDialog";
import { ChemicalRiskBadge } from "./ChemicalRiskBadge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StoffkartotekListProps {
  projectId: string;
}

const getDangerClassColor = (dangerClass: string): string => {
  const classColors: Record<string, string> = {
    "Brannfarlig": "bg-orange-100 text-orange-800 border-orange-300",
    "Oksiderende": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Eksplosiv": "bg-red-100 text-red-800 border-red-300",
    "Giftig": "bg-purple-100 text-purple-800 border-purple-300",
    "Etsende": "bg-rose-100 text-rose-800 border-rose-300",
    "Irriterende": "bg-amber-100 text-amber-800 border-amber-300",
    "Helseskadelig": "bg-pink-100 text-pink-800 border-pink-300",
    "Miljøskadelig": "bg-green-100 text-green-800 border-green-300",
    "Gass under trykk": "bg-blue-100 text-blue-800 border-blue-300",
  };
  return classColors[dangerClass] || "bg-gray-100 text-gray-800 border-gray-300";
};

export const StoffkartotekList = ({ projectId }: StoffkartotekListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CompanyChemicalEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<CompanyChemicalEntry | null>(null);
  const [riskAssessmentEntry, setRiskAssessmentEntry] = useState<CompanyChemicalEntry | null>(null);

  const { data: chemicals = [], isLoading } = useCompanyChemicals(projectId);
  const { removeFromRegistry, getSdsDownloadUrl, isRemoving } = useGlobalChemicalRegistry(projectId);

  // Filter chemicals by search query
  const filteredChemicals = chemicals.filter(entry => {
    const chemical = entry.global_chemical;
    if (!chemical) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      chemical.product_name?.toLowerCase().includes(query) ||
      chemical.manufacturer?.toLowerCase().includes(query) ||
      chemical.cas_number?.toLowerCase().includes(query) ||
      entry.location?.toLowerCase().includes(query)
    );
  });

  const handleDownloadSds = async (entry: CompanyChemicalEntry) => {
    const sdsPath = entry.current_sds?.sds_file_path;
    if (!sdsPath) {
      toast.error("Ingen sikkerhetsdatablad tilgjengelig");
      return;
    }

    const url = await getSdsDownloadUrl(sdsPath, true);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Kunne ikke laste ned sikkerhetsdatablad");
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteEntry) return;
    
    removeFromRegistry(deleteEntry.id, {
      onSuccess: () => {
        setDeleteEntry(null);
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Stoffkartotek
              </CardTitle>
              <CardDescription>
                {chemicals.length} {chemicals.length === 1 ? "stoff" : "stoffer"} registrert
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til stoff
            </Button>
          </div>

          {chemicals.length > 0 && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter produktnavn, produsent, CAS-nummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </CardHeader>

        <CardContent>
          {chemicals.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen stoffer registrert</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Legg til kjemikalier og deres sikkerhetsdatablader i stoffkartoteket
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til første stoff
              </Button>
            </div>
          ) : filteredChemicals.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Ingen stoffer matcher "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produkt</TableHead>
                    <TableHead>Produsent</TableHead>
                    <TableHead>Fareklasser</TableHead>
                    <TableHead>Risikovurdering</TableHead>
                    <TableHead>Lokasjon</TableHead>
                    <TableHead>SDS</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChemicals.map((entry) => {
                    const chemical = entry.global_chemical;
                    if (!chemical) return null;

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{chemical.product_name}</div>
                            {chemical.cas_number && (
                              <div className="text-xs font-mono text-muted-foreground">
                                CAS: {chemical.cas_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {chemical.manufacturer ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {chemical.manufacturer}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {chemical.danger_classes?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {chemical.danger_classes.slice(0, 2).map((dc, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className={cn("text-xs", getDangerClassColor(dc))}
                                >
                                  {dc}
                                </Badge>
                              ))}
                              {chemical.danger_classes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{chemical.danger_classes.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ChemicalRiskBadge
                            chemicalEntryId={entry.id}
                            onClick={() => setRiskAssessmentEntry(entry)}
                          />
                        </TableCell>
                        <TableCell>
                          {entry.location ? (
                            <span className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {entry.location}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.current_sds ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadSds(entry)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Åpne
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Ikke lastet opp
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setRiskAssessmentEntry(entry)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Risikovurdering
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditEntry(entry)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Rediger
                              </DropdownMenuItem>
                              {entry.current_sds && (
                                <DropdownMenuItem onClick={() => handleDownloadSds(entry)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Last ned SDS
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteEntry(entry)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Fjern fra kartotek
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Chemical Dialog */}
      <AddChemicalDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        projectId={projectId}
      />

      {/* Edit Entry Dialog */}
      {editEntry && (
        <EditChemicalEntryDialog
          open={!!editEntry}
          onOpenChange={(open) => !open && setEditEntry(null)}
          entry={editEntry}
          projectId={projectId}
        />
      )}

      {/* Risk Assessment Dialog */}
      {riskAssessmentEntry && (
        <ChemicalRiskAssessmentDialog
          open={!!riskAssessmentEntry}
          onOpenChange={(open) => !open && setRiskAssessmentEntry(null)}
          chemicalEntry={riskAssessmentEntry}
          projectId={projectId}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern stoff fra kartoteket?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette fjerner "{deleteEntry?.global_chemical?.product_name}" fra ditt stoffkartotek.
              Stoffet forblir i det globale registeret og kan legges til igjen senere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Fjerner..." : "Fjern"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
