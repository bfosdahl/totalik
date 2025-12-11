import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardCheck, Calendar, MapPin, User, Camera, Trash2, Eye, CheckCircle2, AlertTriangle, Clock, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Inspection {
  id: string;
  inspection_number: string;
  title: string;
  location: string | null;
  inspection_date: string;
  created_by_name: string;
  status: string;
  notes: string | null;
  findings: any[] | null;
  created_at: string;
  completed_at: string | null;
  company_id: string;
  project_id: string | null;
  weather: string | null;
  participants: string | null;
  photos: string[] | null;
}

export default function Ks2Befaring() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [inspectionDate, setInspectionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [findings, setFindings] = useState<{ description: string; severity: string }[]>([]);
  
  const companyId = profile?.company_id;
  
  // Fetch inspections (standalone, not tied to a project)
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["ks-standalone-inspections", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("simple_project_inspections")
        .select("*")
        .eq("company_id", companyId)
        .is("project_id", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Inspection[];
    },
    enabled: !!companyId,
  });
  
  // Create inspection mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !profile) throw new Error("Missing company or profile");
      
      // Generate inspection number using the RPC function
      const { data: inspectionNumber, error: rpcError } = await supabase
        .rpc("generate_inspection_number", { p_company_id: companyId });
      
      if (rpcError) throw rpcError;
      
      const { data, error } = await supabase
        .from("simple_project_inspections")
        .insert([{
          company_id: companyId,
          project_id: null, // Standalone inspection
          inspection_number: inspectionNumber,
          title,
          location,
          inspection_date: inspectionDate,
          created_by_id: profile.id,
          created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Ukjent",
          notes,
          findings,
          status: "planlagt",
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-standalone-inspections"] });
      toast.success("Befaring opprettet");
      resetForm();
      setIsNewDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette befaring");
      console.error(error);
    },
  });
  
  // Complete inspection mutation
  const completeMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      const { error } = await supabase
        .from("simple_project_inspections")
        .update({
          status: "fullført",
          completed_at: new Date().toISOString(),
        })
        .eq("id", inspectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-standalone-inspections"] });
      toast.success("Befaring fullført");
      setIsViewDialogOpen(false);
    },
  });
  
  // Delete inspection mutation
  const deleteMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      const { error } = await supabase
        .from("simple_project_inspections")
        .delete()
        .eq("id", inspectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-standalone-inspections"] });
      toast.success("Befaring slettet");
    },
  });
  
  const resetForm = () => {
    setTitle("");
    setLocation("");
    setInspectionDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
    setFindings([]);
  };
  
  const addFinding = () => {
    setFindings([...findings, { description: "", severity: "lav" }]);
  };
  
  const updateFinding = (index: number, field: string, value: string) => {
    const updated = [...findings];
    updated[index] = { ...updated[index], [field]: value };
    setFindings(updated);
  };
  
  const removeFinding = (index: number) => {
    setFindings(findings.filter((_, i) => i !== index));
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planlagt":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Planlagt</Badge>;
      case "pågår":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Pågår</Badge>;
      case "fullført":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Fullført</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const plannedInspections = inspections.filter(i => i.status === "planlagt");
  const completedInspections = inspections.filter(i => i.status === "fullført");
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Befaringer</h1>
            <p className="text-muted-foreground">Utfør og dokumenter befaringer</p>
          </div>
          
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ny befaring
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ny befaring</DialogTitle>
                <DialogDescription>Opprett en ny befaring for dokumentasjon</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tittel *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="F.eks. Befaring byggeplass Storgata 1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Lokasjon</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Adresse eller beskrivelse"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Dato</Label>
                  <Input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Notater</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Generelle observasjoner..."
                    rows={3}
                  />
                </div>
                
                {/* Findings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Funn / Avvik</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFinding}>
                      <Plus className="w-3 h-3 mr-1" />
                      Legg til
                    </Button>
                  </div>
                  
                  {findings.map((finding, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={finding.description}
                          onChange={(e) => updateFinding(index, "description", e.target.value)}
                          placeholder="Beskriv funnet..."
                        />
                        <Select
                          value={finding.severity}
                          onValueChange={(value) => updateFinding(index, "severity", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lav">Lav</SelectItem>
                            <SelectItem value="middels">Middels</SelectItem>
                            <SelectItem value="høy">Høy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFinding(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!title || createMutation.isPending}
                >
                  {createMutation.isPending ? "Oppretter..." : "Opprett befaring"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{plannedInspections.length}</p>
                  <p className="text-sm text-muted-foreground">Planlagte</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedInspections.length}</p>
                  <p className="text-sm text-muted-foreground">Fullførte</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <ClipboardCheck className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inspections.length}</p>
                  <p className="text-sm text-muted-foreground">Totalt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Inspections List */}
        <Card>
          <CardHeader>
            <CardTitle>Befaringer</CardTitle>
            <CardDescription>Oversikt over alle befaringer</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Laster...</div>
            ) : inspections.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen befaringer ennå</h3>
                <p className="text-muted-foreground mb-4">Opprett din første befaring for å komme i gang</p>
                <Button onClick={() => setIsNewDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ny befaring
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{inspection.title}</span>
                          {getStatusBadge(inspection.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(inspection.inspection_date), "d. MMM yyyy", { locale: nb })}
                          </span>
                          {inspection.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {inspection.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {inspection.created_by_name}
                          </span>
                        </div>
                        {inspection.findings && inspection.findings.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {inspection.findings.length} funn registrert
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedInspection(inspection);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Er du sikker på at du vil slette denne befaringen?")) {
                            deleteMutation.mutate(inspection.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedInspection?.title}</DialogTitle>
              <DialogDescription>
                {selectedInspection?.inspection_number}
              </DialogDescription>
            </DialogHeader>
            
            {selectedInspection && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedInspection.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Dato</span>
                    <p className="font-medium">
                      {format(new Date(selectedInspection.inspection_date), "d. MMMM yyyy", { locale: nb })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inspektør</span>
                    <p className="font-medium">{selectedInspection.created_by_name}</p>
                  </div>
                </div>
                
                {selectedInspection.location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Lokasjon</span>
                    <p className="font-medium">{selectedInspection.location}</p>
                  </div>
                )}
                
                {selectedInspection.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notater</span>
                    <p className="mt-1">{selectedInspection.notes}</p>
                  </div>
                )}
                
                {selectedInspection.findings && selectedInspection.findings.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Funn ({selectedInspection.findings.length})</span>
                    <div className="space-y-2">
                      {selectedInspection.findings.map((finding: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm">{finding.description}</p>
                            <Badge
                              variant="outline"
                              className={
                                finding.severity === "høy"
                                  ? "bg-red-500/10 text-red-600 border-red-500/30"
                                  : finding.severity === "middels"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                  : "bg-green-500/10 text-green-600 border-green-500/30"
                              }
                            >
                              {finding.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="gap-2">
              {selectedInspection?.status !== "fullført" && (
                <Button
                  onClick={() => completeMutation.mutate(selectedInspection!.id)}
                  disabled={completeMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Fullfør befaring
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Lukk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
