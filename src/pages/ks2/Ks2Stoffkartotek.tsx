import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FlaskConical, 
  Plus, 
  Search,
  FileText,
  AlertTriangle,
  Loader2,
  Trash2,
  Download,
  Eye,
  Building2,
  MapPin,
  MoreVertical,
  Edit2,
  Globe,
  Upload
} from "lucide-react";
import { 
  useCompanyChemicals, 
  useGlobalChemicalRegistry,
  CompanyChemicalEntry 
} from "@/hooks/useGlobalChemicalRegistry";
import { AddChemicalDialog } from "@/components/stoffkartotek/AddChemicalDialog";
import { EditChemicalEntryDialog } from "@/components/stoffkartotek/EditChemicalEntryDialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
    "Sensibiliserende": "bg-indigo-100 text-indigo-800 border-indigo-300",
    "Miljøfarlig": "bg-emerald-100 text-emerald-800 border-emerald-300",
    "Eksplosjonsfarlig": "bg-red-100 text-red-800 border-red-300",
  };
  return classColors[dangerClass] || "bg-gray-100 text-gray-800 border-gray-300";
};

export default function Ks2Stoffkartotek() {
  const { projectId } = useParams();
  const { company } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CompanyChemicalEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<CompanyChemicalEntry | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { data: chemicals = [], isLoading } = useCompanyChemicals(projectId || null);
  const { removeFromRegistry, getSdsDownloadUrl, isRemoving } = useGlobalChemicalRegistry(projectId || null);

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

  if (!projectId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Velg et prosjekt for å se stoffkartoteket</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <FlaskConical className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Stoffkartotek</h2>
            <p className="text-muted-foreground">
              {chemicals.length} {chemicals.length === 1 ? "stoff" : "stoffer"} registrert
            </p>
          </div>
        </div>
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Legg til stoff
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                Globalt stoffregister
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Stoffer du legger til deles automatisk i et felles register. Andre bedrifter kan gjenbruke 
                sikkerhetsdatablader, noe som sparer tid og sikrer oppdatert informasjon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      {chemicals.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter produktnavn, produsent, CAS-nummer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
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
      ) : chemicals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen stoffer registrert</h3>
            <p className="text-muted-foreground text-center mb-4">
              Legg til stoffer og kjemikalier som brukes i prosjektet
            </p>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til stoff
            </Button>
          </CardContent>
        </Card>
      ) : filteredChemicals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen treff</h3>
            <p className="text-muted-foreground text-center">
              Ingen stoffer matcher "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChemicals.map((entry) => {
            const chemical = entry.global_chemical;
            if (!chemical) return null;

            return (
              <Card key={entry.id} className="hover:border-emerald-500/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{chemical.product_name}</CardTitle>
                      {chemical.manufacturer && (
                        <CardDescription className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {chemical.manufacturer}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* CAS number */}
                    {chemical.cas_number && (
                      <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
                        CAS: {chemical.cas_number}
                      </div>
                    )}

                    {/* Danger classes */}
                    {chemical.danger_classes && chemical.danger_classes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {chemical.danger_classes.slice(0, 3).map((dc, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className={cn("text-xs", getDangerClassColor(dc))}
                          >
                            {dc}
                          </Badge>
                        ))}
                        {chemical.danger_classes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{chemical.danger_classes.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Location */}
                    {entry.location && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {entry.location}
                      </div>
                    )}

                    {/* Quantity */}
                    {entry.quantity && (
                      <div className="text-sm text-muted-foreground">
                        Mengde: {entry.quantity}
                      </div>
                    )}
                    
                    {/* Updated date */}
                    <div className="text-xs text-muted-foreground">
                      Oppdatert: {format(new Date(entry.last_updated), "d. MMM yyyy", { locale: nb })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => entry.current_sds ? handleDownloadSds(entry) : setEditEntry(entry)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {entry.current_sds ? "Se SDS" : "Ingen SDS"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setEditEntry(entry)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detaljer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern stoff fra kartoteket?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette fjerner "{deleteEntry?.global_chemical?.product_name}" fra prosjektets stoffkartotek.
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
    </div>
  );
}
