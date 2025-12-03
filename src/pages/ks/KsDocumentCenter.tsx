import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Search, 
  FileImage,
  Shield,
  AlertTriangle,
  Package,
  FileSignature,
  GraduationCap,
  FileStack,
  ClipboardCheck,
  Printer,
  Eye
} from "lucide-react";
import { useKsProjectDocuments } from "@/hooks/useKsProjectDocuments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generateChecklistPdf } from "@/utils/ksChecklistPdf";
import { exportSingleKsSjaToPDF } from "@/utils/ksSjaExport";
import { toast } from "sonner";

const CATEGORY_CONFIG = {
  tegninger: { label: "Tegninger", icon: FileText, color: "bg-blue-500" },
  beskrivelser: { label: "Beskrivelser", icon: FileText, color: "bg-purple-500" },
  sha_plan: { label: "SHA-plan", icon: Shield, color: "bg-green-500" },
  bilder: { label: "Bilder", icon: FileImage, color: "bg-yellow-500" },
  endringsmeldinger: { label: "Endringsmeldinger", icon: AlertTriangle, color: "bg-orange-500" },
  fdv: { label: "FDV-dokumentasjon", icon: Package, color: "bg-cyan-500" },
  samsvar: { label: "Samsvarserklæringer", icon: FileSignature, color: "bg-emerald-500" },
  kompetanse: { label: "Kompetanse/Kurs", icon: GraduationCap, color: "bg-indigo-500" },
  maler: { label: "Maler for nedlastning", icon: FileStack, color: "bg-pink-500" },
  egenkontroller: { label: "Egenkontroller (Auto)", icon: ClipboardCheck, color: "bg-teal-500" },
  sja_dokumenter: { label: "SJA-dokumenter (Auto)", icon: Shield, color: "bg-lime-500" },
  vernerunder: { label: "Vernerunder (Auto)", icon: Shield, color: "bg-violet-500" },
};

export default function KsDocumentCenter() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const { documents, downloadDocument } = useKsProjectDocuments(projectId || "");

  // Generate signed URL for preview
  const handlePreviewDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry
      
      if (error) throw error;
      
      setPreviewUrl(data.signedUrl);
      setPreviewDoc(doc);
    } catch (error) {
      console.error('Error creating preview URL:', error);
      toast.error('Kunne ikke forhåndsvise dokumentet');
    }
  };

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ["ks-project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch checklists
  const { data: checklists = [] } = useQuery({
    queryKey: ["ks-checklists", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_checklists")
        .select(`
          *,
          template:ks_templates(name, phase),
          items:ks_checklist_items(
            *,
            template_item:ks_template_items(*),
            photos:ks_photos(*)
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch SJAs
  const { data: sjas = [] } = useQuery({
    queryKey: ["project-sjas", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_sja")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleDownloadChecklistPdf = async (checklist: any) => {
    try {
      // Prepare photos grouped by checklist item
      const photosByItem: Record<string, any[]> = {};
      checklist.items?.forEach((item: any) => {
        if (item.photos && item.photos.length > 0) {
          photosByItem[item.id] = item.photos;
        }
      });

      const checklistData = {
        id: checklist.id,
        created_at: checklist.created_at,
        filled_at: checklist.filled_at,
        phase: checklist.phase,
        template: {
          name: checklist.template?.name || "Sjekkliste",
          trade: checklist.template?.trade || null,
        },
        project: {
          name: project?.name || "Prosjekt",
          project_number: project?.project_number || null,
          address: project?.address || null,
        },
        items: checklist.items || [],
        photos: photosByItem,
      };
      await generateChecklistPdf(checklistData);
      toast.success("Sjekkliste-PDF lastet ned");
    } catch (error) {
      console.error("Error generating checklist PDF:", error);
      toast.error("Kunne ikke generere PDF");
    }
  };

  const handleDownloadSjaPdf = async (sja: any) => {
    try {
      await exportSingleKsSjaToPDF(sja);
      toast.success("SJA-PDF lastet ned");
    } catch (error) {
      console.error("Error generating SJA PDF:", error);
      toast.error("Kunne ikke generere PDF");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isPreviewable = (doc: any) => {
    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return previewableTypes.includes(doc.file_type);
  };

  const filteredDocuments = documents.filter(doc => 
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredChecklists = checklists.filter(checklist =>
    checklist.template?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    checklist.template?.phase?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSjas = sjas.filter(sja =>
    sja.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sja.sja_nr?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/ks/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Dokumentsenter</h1>
            <p className="text-muted-foreground">
              {project?.name || "Prosjekt"}
            </p>
          </div>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Skriv ut
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter dokumenter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="uploaded" className="space-y-4">
          <TabsList>
            <TabsTrigger value="uploaded">
              Opplastede dokumenter ({filteredDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="checklists">
              Sjekklister ({filteredChecklists.length})
            </TabsTrigger>
            <TabsTrigger value="sja">
              SJA ({filteredSjas.length})
            </TabsTrigger>
          </TabsList>

          {/* Uploaded Documents */}
          <TabsContent value="uploaded" className="space-y-4">
            {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
              const categoryDocs = filteredDocuments.filter(d => d.category === category);
              if (categoryDocs.length === 0) return null;

              const Icon = config.icon;

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${config.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {config.label}
                    </CardTitle>
                    <CardDescription>
                      {categoryDocs.length} dokument{categoryDocs.length !== 1 ? 'er' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryDocs.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.document_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {doc.document_number && (
                                <Badge variant="outline" className="text-xs">
                                  {doc.document_number}
                                </Badge>
                              )}
                              <span>v{doc.version}</span>
                              <span>•</span>
                              <span>{format(new Date(doc.created_at), "dd.MM.yyyy", { locale: nb })}</span>
                              <span>•</span>
                              <span>{doc.uploaded_by_name}</span>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {isPreviewable(doc) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadDocument(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredDocuments.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen dokumenter funnet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Checklists */}
          <TabsContent value="checklists" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Sjekklister
                </CardTitle>
                <CardDescription>
                  {filteredChecklists.length} sjekkliste{filteredChecklists.length !== 1 ? 'r' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredChecklists.map(checklist => (
                    <div
                      key={checklist.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{checklist.template?.name || "Sjekkliste"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {checklist.template?.phase && (
                            <Badge variant="outline" className="text-xs">
                              {checklist.template.phase}
                            </Badge>
                          )}
                          {checklist.filled_at && (
                            <>
                              <span>•</span>
                              <span>Utført: {format(new Date(checklist.filled_at), "dd.MM.yyyy", { locale: nb })}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/ks/checklist/${checklist.id}`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadChecklistPdf(checklist)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {filteredChecklists.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen sjekklister funnet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SJA */}
          <TabsContent value="sja" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sikker Jobb Analyse
                </CardTitle>
                <CardDescription>
                  {filteredSjas.length} SJA{filteredSjas.length !== 1 ? '-er' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredSjas.map(sja => (
                    <div
                      key={sja.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{sja.title || "SJA"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {sja.sja_nr && (
                            <Badge variant="outline" className="text-xs">
                              {sja.sja_nr}
                            </Badge>
                          )}
                          {sja.date && (
                            <>
                              <span>•</span>
                              <span>{format(new Date(sja.date), "dd.MM.yyyy", { locale: nb })}</span>
                            </>
                          )}
                          {sja.status && (
                            <>
                              <span>•</span>
                              <Badge variant={sja.status === "active" ? "default" : "secondary"} className="text-xs">
                                {sja.status === "active" ? "Aktiv" : sja.status === "completed" ? "Fullført" : "Arkivert"}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadSjaPdf(sja)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {filteredSjas.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen SJA funnet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => { setPreviewDoc(null); setPreviewUrl(""); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.document_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewDoc && previewUrl && (
              <>
                {previewDoc.file_type === 'application/pdf' && (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh] border-0"
                    title={previewDoc.document_name}
                  />
                )}
                {previewDoc.file_type?.startsWith('image/') && (
                  <img
                    src={previewUrl}
                    alt={previewDoc.document_name}
                    className="w-full h-auto"
                  />
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setPreviewDoc(null); setPreviewUrl(""); }}>
              Lukk
            </Button>
            <Button onClick={() => previewDoc && downloadDocument(previewDoc)}>
              <Download className="h-4 w-4 mr-2" />
              Last ned
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
