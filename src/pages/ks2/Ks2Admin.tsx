import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  FileText, 
  Settings, 
  Edit, 
  Trash2, 
  Upload,
  CheckSquare,
  ArrowLeft,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  Image
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useKsModule2Templates } from "@/hooks/useKsModule2Templates";
import { useKsModule2Settings } from "@/hooks/useKsModule2Settings";
import { useKsModule2DocumentTemplates } from "@/hooks/useKsModule2DocumentTemplates";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "betong", label: "Betong" },
  { value: "våtrom", label: "Våtrom" },
  { value: "tømrer", label: "Tømrer" },
  { value: "tak", label: "Tak" },
  { value: "grunn", label: "Grunnarbeid" },
  { value: "brann", label: "Brann" },
  { value: "elektro", label: "Elektro" },
  { value: "rør", label: "Rørlegger" },
  { value: "ventilasjon", label: "Ventilasjon" },
  { value: "gulv", label: "Gulv" },
  { value: "overflate", label: "Overflate" },
  { value: "fasade", label: "Fasade" },
  { value: "utomhus", label: "Utomhus" },
  { value: "ferdigstillelse", label: "Ferdigstillelse" },
  { value: "general", label: "Generelt" },
];

const DOCUMENT_CATEGORIES = [
  { value: "sjekkliste", label: "Sjekkliste-mal" },
  { value: "skjema", label: "Skjema" },
  { value: "rutine", label: "Rutine" },
  { value: "byggesak", label: "Byggesak" },
  { value: "kontrakt", label: "Kontrakt" },
  { value: "annet", label: "Annet" },
];

export default function Ks2Admin() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { templates, isLoading: templatesLoading, createTemplate, updateTemplate, deleteTemplate } = useKsModule2Templates();
  const { settings, isLoading: settingsLoading, updateSettings } = useKsModule2Settings();
  const { documents, isLoading: documentsLoading, uploadDocument, deleteDocument, getDownloadUrl, isUploading } = useKsModule2DocumentTemplates();
  
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    template_name: "",
    category: "general",
    description: "",
    checkpoints: [] as any[]
  });
  const [newCheckpoint, setNewCheckpoint] = useState({
    text: "",
    type: "yesno",
    required: true
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    category: "sjekkliste",
    description: ""
  });

  const handleCreateTemplate = async () => {
    if (!newTemplate.template_name) {
      toast.error("Mal må ha et navn");
      return;
    }
    
    await createTemplate({
      template_name: newTemplate.template_name,
      category: newTemplate.category,
      description: newTemplate.description,
      checkpoints: newTemplate.checkpoints
    });
    
    setNewTemplate({ template_name: "", category: "general", description: "", checkpoints: [] });
    setIsNewTemplateOpen(false);
  };

  const handleAddCheckpoint = () => {
    if (!newCheckpoint.text) return;
    
    const checkpoint = {
      id: String(newTemplate.checkpoints.length + 1),
      text: newCheckpoint.text,
      type: newCheckpoint.type,
      required: newCheckpoint.required
    };
    
    setNewTemplate(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, checkpoint]
    }));
    setNewCheckpoint({ text: "", type: "yesno", required: true });
  };

  const handleDeleteCheckpoint = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne malen?")) {
      await deleteTemplate(id);
    }
  };

  const handleSaveSettings = async (field: string, value: any) => {
    await updateSettings({ [field]: value });
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadData.title) {
      toast.error("Velg fil og fyll inn tittel");
      return;
    }
    
    uploadDocument({
      file: uploadFile,
      title: uploadData.title,
      category: uploadData.category,
      description: uploadData.description,
      isSystemTemplate: true
    }, {
      onSuccess: () => {
        setUploadFile(null);
        setUploadData({ title: "", category: "sjekkliste", description: "" });
        setIsUploadDocOpen(false);
      }
    });
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (confirm("Er du sikker på at du vil slette dette dokumentet?")) {
      deleteDocument(doc);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType?.includes("word") || fileType?.includes("document")) return <File className="h-8 w-8 text-blue-500" />;
    if (fileType?.includes("image")) return <Image className="h-8 w-8 text-green-500" />;
    if (fileType?.includes("spreadsheet") || fileType?.includes("excel")) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Ukjent størrelse";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ks")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Admin – KS Bygg</h1>
              <p className="text-muted-foreground">Administrer maler, dokumenter og innstillinger</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="templates" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Sjekkliste-maler</span>
              <span className="sm:hidden">Maler</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Dokumentbank</span>
              <span className="sm:hidden">Dok</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Innstillinger</span>
              <span className="sm:hidden">Innst.</span>
            </TabsTrigger>
          </TabsList>

          {/* Sjekkliste-maler Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Sjekkliste-maler</h2>
                <p className="text-sm text-muted-foreground">
                  {templates.length} maler tilgjengelig
                </p>
              </div>
              <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ny mal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Opprett ny sjekkliste-mal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Malnavn *</Label>
                        <Input 
                          value={newTemplate.template_name}
                          onChange={e => setNewTemplate(prev => ({ ...prev, template_name: e.target.value }))}
                          placeholder="F.eks. Betongstøp kontroll"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select 
                          value={newTemplate.category}
                          onValueChange={v => setNewTemplate(prev => ({ ...prev, category: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Beskrivelse</Label>
                      <Textarea 
                        value={newTemplate.description}
                        onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Kort beskrivelse av malen..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sjekkpunkter ({newTemplate.checkpoints.length})</Label>
                      <div className="border rounded-lg p-4 space-y-3">
                        {newTemplate.checkpoints.map((cp, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <span className="flex-1 text-sm">{cp.text}</span>
                            <Badge variant="outline">{cp.type}</Badge>
                            {cp.required && <Badge>Påkrevd</Badge>}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteCheckpoint(idx)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        
                        <div className="flex gap-2 items-end pt-2 border-t">
                          <div className="flex-1">
                            <Input 
                              value={newCheckpoint.text}
                              onChange={e => setNewCheckpoint(prev => ({ ...prev, text: e.target.value }))}
                              placeholder="Nytt sjekkpunkt..."
                            />
                          </div>
                          <Select 
                            value={newCheckpoint.type}
                            onValueChange={v => setNewCheckpoint(prev => ({ ...prev, type: v }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yesno">Ja/Nei</SelectItem>
                              <SelectItem value="text">Tekst</SelectItem>
                              <SelectItem value="number">Tall</SelectItem>
                              <SelectItem value="photo">Bilde</SelectItem>
                              <SelectItem value="signature">Signatur</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={newCheckpoint.required}
                              onCheckedChange={v => setNewCheckpoint(prev => ({ ...prev, required: v }))}
                            />
                            <span className="text-xs">Påkrevd</span>
                          </div>
                          <Button onClick={handleAddCheckpoint} size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsNewTemplateOpen(false)}>
                        Avbryt
                      </Button>
                      <Button onClick={handleCreateTemplate}>
                        Opprett mal
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {templatesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Laster maler...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map(template => (
                  <Card key={template.id} className="relative">
                    {template.is_system_template && (
                      <Badge className="absolute top-2 right-2" variant="secondary">System</Badge>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{template.template_name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mr-2">
                          {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                        </Badge>
                        {(template.checkpoints as any[])?.length || 0} punkter
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {template.description || "Ingen beskrivelse"}
                      </p>
                      {!template.is_system_template && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-3 w-3" /> Rediger
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1 text-destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-3 w-3" /> Slett
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Dokumentbank Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Dokumentbank</h2>
                <p className="text-sm text-muted-foreground">
                  {documents.length} dokumenter tilgjengelig for nedlasting
                </p>
              </div>
              <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Last opp dokument
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Last opp nytt dokument</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Fil *</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        {uploadFile ? (
                          <div className="space-y-2">
                            <FileText className="h-10 w-10 mx-auto text-primary" />
                            <p className="font-medium">{uploadFile.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                            <Button variant="outline" size="sm" onClick={() => setUploadFile(null)}>
                              Fjern
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">Klikk for å velge fil</p>
                            <p className="text-xs text-muted-foreground">PDF, Word, bilder (maks 50MB)</p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setUploadFile(e.target.files[0]);
                                }
                              }}
                            />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                              Velg fil
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tittel *</Label>
                      <Input
                        value={uploadData.title}
                        onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="F.eks. Betongstøp sjekkliste"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Select
                        value={uploadData.category}
                        onValueChange={(v) => setUploadData(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Beskrivelse</Label>
                      <Textarea
                        value={uploadData.description}
                        onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Kort beskrivelse..."
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsUploadDocOpen(false)}>
                        Avbryt
                      </Button>
                      <Button onClick={handleUploadDocument} disabled={isUploading}>
                        {isUploading ? "Laster opp..." : "Last opp"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {documentsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Laster dokumenter...</div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen dokumenter lastet opp ennå</p>
                  <p className="text-sm">Last opp PDF/Word-filer som kan brukes som papirmaler</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map(doc => (
                  <Card key={doc.id} className="relative">
                    <Badge className="absolute top-2 right-2" variant="outline">
                      {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                    </Badge>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        {getFileIcon(doc.file_type)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{doc.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {doc.file_name} • {formatFileSize(doc.file_size)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 flex-1"
                          onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                        >
                          <Eye className="h-3 w-3" /> Vis
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 flex-1"
                          onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                        >
                          <Download className="h-3 w-3" /> Last ned
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Innstillinger Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-xl font-semibold">Firma-innstillinger</h2>
            
            {settingsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Laster innstillinger...</div>
            ) : (
              <div className="grid gap-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generelt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Standard frist (dager)</Label>
                        <p className="text-sm text-muted-foreground">
                          Antall dager til frist når ny sjekkliste opprettes
                        </p>
                      </div>
                      <Input 
                        type="number"
                        className="w-24"
                        value={settings?.default_deadline_days || 7}
                        onChange={e => handleSaveSettings("default_deadline_days", parseInt(e.target.value))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Varsler</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>E-postvarsler</Label>
                        <p className="text-sm text-muted-foreground">
                          Send automatiske e-postvarsler ved frister og hendelser
                        </p>
                      </div>
                      <Switch 
                        checked={settings?.email_notifications_enabled ?? true}
                        onCheckedChange={v => handleSaveSettings("email_notifications_enabled", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ukentlig KS-rapport</Label>
                        <p className="text-sm text-muted-foreground">
                          Send ukentlig statusrapport til prosjektleder
                        </p>
                      </div>
                      <Switch 
                        checked={settings?.weekly_report_enabled ?? true}
                        onCheckedChange={v => handleSaveSettings("weekly_report_enabled", v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Branding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Firma-logo</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Vises på alle genererte rapporter og PDF-er
                      </p>
                      <Button variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Last opp logo
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Aksentfarge</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color"
                          className="w-16 h-10 p-1"
                          value={settings?.accent_color || "#5B6BFF"}
                          onChange={e => handleSaveSettings("accent_color", e.target.value)}
                        />
                        <Input 
                          value={settings?.accent_color || "#5B6BFF"}
                          onChange={e => handleSaveSettings("accent_color", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
