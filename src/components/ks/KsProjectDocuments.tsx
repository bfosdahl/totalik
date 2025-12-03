import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Trash2, Plus, FileImage, FileCheck, Shield, AlertTriangle, Package, FileSignature, Loader2, GraduationCap, FileStack, FolderPlus, Eye, Copy, Library } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useKsProjectDocuments, NewKsProjectDocumentInput, KsProjectDocument } from "@/hooks/useKsProjectDocuments";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DocumentSourceSelector } from "./DocumentSourceSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  egenkontroller: { label: "Egenkontroller (Auto)", icon: FileCheck, color: "bg-teal-500" },
  sja_dokumenter: { label: "SJA-dokumenter (Auto)", icon: Shield, color: "bg-lime-500" },
  vernerunder: { label: "Vernerunder (Auto)", icon: Shield, color: "bg-violet-500" },
};

interface KsProjectDocumentsProps {
  projectId: string;
}

export const KsProjectDocuments = ({ projectId }: KsProjectDocumentsProps) => {
  const { documents, isLoading, uploadDocument, isUploading, deleteDocument, downloadDocument, toggleIncludeInReport } = useKsProjectDocuments(projectId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("tegninger");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [description, setDescription] = useState("");
  const [supersedes, setSupersedes] = useState<string>("");
  const [activeTab, setActiveTab] = useState("documents");
  const [templateSearch, setTemplateSearch] = useState("");

  // Fetch admin documents (templates)
  const { data: adminDocuments = [], isLoading: isLoadingAdmin } = useQuery({
    queryKey: ['admin-documents-for-project'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_documents')
        .select('*')
        .order('document_type', { ascending: true })
        .order('document_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Filter admin documents by search
  const filteredAdminDocuments = adminDocuments.filter(doc =>
    doc.document_name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Preview admin document
  const previewAdminDocument = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('admin-documents')
      .createSignedUrl(filePath, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  // Download admin document
  const downloadAdminDocument = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .download(filePath);
    
    if (error) {
      toast.error('Kunne ikke laste ned dokument');
      return;
    }
    
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy admin document to project
  const copyAdminDocumentToProject = async (adminDoc: typeof adminDocuments[0]) => {
    try {
      // Download the file from admin-documents bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('admin-documents')
        .download(adminDoc.file_path);
      
      if (downloadError) throw downloadError;
      
      // Create a File object from the blob
      const file = new File([fileData], adminDoc.document_name + (adminDoc.file_type ? `.${adminDoc.file_type.split('/').pop()}` : ''), {
        type: adminDoc.file_type || 'application/octet-stream'
      });
      
      // Map admin document type to project category
      const categoryMap: Record<string, string> = {
        'byggesak': 'tegninger',
        'rutine': 'beskrivelser',
        'mal': 'maler',
        'sjekkliste': 'tegninger',
        'annet': 'beskrivelser'
      };
      
      const category = categoryMap[adminDoc.document_type] || 'maler';
      
      // Upload to project documents
      const input: NewKsProjectDocumentInput = {
        document_name: adminDoc.document_name,
        category: category as NewKsProjectDocumentInput['category'],
        description: adminDoc.description || `Kopiert fra malbibliotek`,
        file: file,
      };
      
      uploadDocument(input, {
        onSuccess: () => {
          toast.success(`"${adminDoc.document_name}" ble kopiert til prosjektet`);
        },
        onError: () => {
          toast.error('Kunne ikke kopiere dokument til prosjektet');
        }
      });
    } catch (error) {
      toast.error('Kunne ikke kopiere dokument til prosjektet');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile || !documentName) return;

    const input: NewKsProjectDocumentInput = {
      document_name: documentName,
      document_number: documentNumber || undefined,
      category: selectedCategory as NewKsProjectDocumentInput['category'],
      description: description || undefined,
      file: selectedFile,
      supersedes_document_id: supersedes || undefined,
    };

    uploadDocument(input, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setSelectedFile(null);
        setDocumentName("");
        setDocumentNumber("");
        setDescription("");
        setSupersedes("");
      },
    });
  };

  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, KsProjectDocument[]>);

  // Get latest versions for superseding
  const latestVersions = documents.filter(d => 
    d.is_latest_version && d.category === selectedCategory
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Dokumentstyring</h3>
          <p className="text-sm text-muted-foreground">
            Administrer prosjektdokumenter med versjonskontroll
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddOptions(!showAddOptions)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            {showAddOptions ? "Skjul valg" : "Legg til dokumentasjon"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Rask opplasting
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Last opp nytt dokument</DialogTitle>
              <DialogDescription>
                Fyll ut informasjon og last opp dokument. Dokumenter organiseres automatisk med versjonskontroll.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentName">Dokumentnavn *</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="F.eks. 'Arbeidstegning hovedetasje'"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentNumber">Dokumentnummer / Referanse</Label>
                <Input
                  id="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="F.eks. 'Tegning 123' eller 'Rev A'"
                />
              </div>

              {latestVersions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="supersedes">Erstatter dokument (ny versjon)</Label>
                  <Select value={supersedes} onValueChange={setSupersedes}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg dokument å erstatte" />
                    </SelectTrigger>
                    <SelectContent>
                      {latestVersions.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.document_name} {doc.document_number && `(${doc.document_number})`} - v{doc.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Valgfri beskrivelse av dokumentet"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Fil *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Valgt fil: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Avbryt
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!selectedFile || !documentName || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Laster opp...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Last opp
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Document Source Selector */}
      {showAddOptions && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Velg dokumentasjonstype
            </CardTitle>
            <CardDescription>
              Last opp egne dokumenter eller bruk systemets sjekklister
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentSourceSelector 
              projectId={projectId} 
              onComplete={() => setShowAddOptions(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Tabs for Documents and Templates */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prosjektdokumenter ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Malbibliotek ({adminDocuments.length})
          </TabsTrigger>
        </TabsList>

        {/* Project Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          {Object.keys(documentsByCategory).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen dokumenter lastet opp ennå</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                const categoryDocs = documentsByCategory[category];
                if (!categoryDocs || categoryDocs.length === 0) return null;

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
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dokumentnavn</TableHead>
                            <TableHead>Nr/Ref</TableHead>
                            <TableHead>Versjon</TableHead>
                            <TableHead>Opplastet</TableHead>
                            <TableHead>Opplastet av</TableHead>
                            <TableHead className="text-center">Inkluder i rapport</TableHead>
                            <TableHead className="text-right">Handlinger</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryDocs.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                <div>
                                  {doc.document_name}
                                  {doc.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {doc.document_number && (
                                  <Badge variant="outline">{doc.document_number}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant={doc.is_latest_version ? "default" : "secondary"}>
                                    v{doc.version}
                                  </Badge>
                                  {doc.is_latest_version && (
                                    <Badge variant="outline" className="text-xs">
                                      Gjeldende
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {doc.uploaded_by_name}
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={doc.include_in_report}
                                  onCheckedChange={(checked) => 
                                    toggleIncludeInReport({ 
                                      documentId: doc.id, 
                                      include: checked === true 
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadDocument(doc)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Slett dokument?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Er du sikker på at du vil slette "{doc.document_name}"? Denne handlingen kan ikke angres.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteDocument(doc.id)}>
                                          Slett
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab (Admin Documents) */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Søk i maler..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoadingAdmin ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredAdminDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Library className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen dokumentmaler tilgjengelig</p>
                <p className="text-sm mt-2">Kontakt administrator for å legge til maler</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Library className="h-5 w-5" />
                  Dokumentmaler ({filteredAdminDocuments.length})
                </CardTitle>
                <CardDescription>
                  Last ned maler for utfylling, eller kopier direkte til prosjektet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAdminDocuments.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.document_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {doc.document_type}
                            </Badge>
                            {doc.file_size && (
                              <span className="text-xs text-muted-foreground">
                                {(doc.file_size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewAdminDocument(doc.file_path)}
                          title="Forhåndsvis"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAdminDocument(doc.file_path, doc.document_name)}
                          title="Last ned"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyAdminDocumentToProject(doc)}
                          disabled={isUploading}
                          title="Kopier til prosjekt"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Bruk
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
