import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useKsModule2Routines, KsModule2Routine } from '@/hooks/useKsModule2Routines';
import { useKsModule2Templates } from '@/hooks/useKsModule2Templates';
import { Plus, FileText, Upload, Eye, Download, Trash2, Link2, Unlink, BookOpen, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'Generell' },
  { value: 'quality', label: 'Kvalitetssikring' },
  { value: 'safety', label: 'HMS/Sikkerhet' },
  { value: 'subcontractor', label: 'Underentreprenør' },
  { value: 'documentation', label: 'Dokumentasjon' },
  { value: 'execution', label: 'Utførelse' },
];

export default function Ks2Rutiner() {
  const { projectId } = useParams<{ projectId: string }>();
  const { 
    routines, 
    isLoading, 
    isSaving,
    createRoutine, 
    deleteRoutine, 
    uploadDocument, 
    getDocumentUrl,
    linkRoutineToTemplate,
    unlinkRoutineFromTemplate,
    getLinkedTemplates,
  } = useKsModule2Routines(projectId);
  const { templates } = useKsModule2Templates();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<KsModule2Routine | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('structured');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: 'general',
    responsible_role: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateRoutine = async () => {
    if (!projectId) return;

    if (activeTab === 'upload' && selectedFile) {
      const uploaded = await uploadDocument(selectedFile, projectId);
      if (uploaded) {
        await createRoutine({
          project_id: projectId,
          name: formData.name || selectedFile.name,
          description: formData.description,
          document_path: uploaded.path,
          document_name: uploaded.name,
          category: formData.category,
          responsible_role: formData.responsible_role,
          is_document: true,
        });
      }
    } else {
      await createRoutine({
        project_id: projectId,
        name: formData.name,
        description: formData.description,
        content: formData.content,
        category: formData.category,
        responsible_role: formData.responsible_role,
        is_document: false,
      });
    }

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', content: '', category: 'general', responsible_role: '' });
    setSelectedFile(null);
    setActiveTab('structured');
  };

  const handleViewDocument = async (routine: KsModule2Routine) => {
    if (routine.document_path) {
      const url = await getDocumentUrl(routine.document_path);
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  const handleDownloadDocument = async (routine: KsModule2Routine) => {
    if (routine.document_path) {
      const url = await getDocumentUrl(routine.document_path);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = routine.document_name || 'dokument';
        link.click();
      }
    }
  };

  const handleOpenLinkDialog = (routine: KsModule2Routine) => {
    setSelectedRoutine(routine);
    setIsLinkDialogOpen(true);
  };

  const handleToggleLink = async (templateId: string) => {
    if (!selectedRoutine) return;
    
    const linkedTemplates = getLinkedTemplates(selectedRoutine.id);
    if (linkedTemplates.includes(templateId)) {
      await unlinkRoutineFromTemplate(selectedRoutine.id, templateId);
    } else {
      await linkRoutineToTemplate(selectedRoutine.id, templateId);
    }
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rutinebank</h1>
          <p className="text-muted-foreground">Kvalitetssikringsrutiner knyttet til prosjektet</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny rutine
        </Button>
      </div>

      {routines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen rutiner ennå</h3>
            <p className="text-muted-foreground text-center mb-4">
              Opprett kvalitetssikringsrutiner og knytt dem til sjekklister
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Opprett første rutine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {routines.map((routine) => {
            const linkedTemplates = getLinkedTemplates(routine.id);
            const linkedTemplateNames = linkedTemplates
              .map(id => templates.find(t => t.id === id)?.template_name)
              .filter(Boolean);

            return (
              <Card key={routine.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {routine.routine_number}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(routine.category)}
                        </Badge>
                        {routine.is_document && (
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            <FileText className="h-3 w-3 mr-1" />
                            Dokument
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg mt-2">{routine.name}</CardTitle>
                      {routine.description && (
                        <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>
                      )}
                      {routine.responsible_role && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ansvarlig: {routine.responsible_role}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {routine.is_document && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleViewDocument(routine)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(routine)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleOpenLinkDialog(routine)}>
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteRoutineId(routine.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!routine.is_document && routine.content && (
                    <div className="bg-muted/50 rounded-md p-3 mb-3">
                      <p className="text-sm whitespace-pre-wrap">{routine.content}</p>
                    </div>
                  )}
                  {linkedTemplateNames.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">Koblet til:</span>
                      {linkedTemplateNames.map((name, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Routine Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ny rutine</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="structured">
                <FileText className="h-4 w-4 mr-2" />
                Opprett i systemet
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Last opp dokument
              </TabsTrigger>
            </TabsList>

            <TabsContent value="structured" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Rutinenavn *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="F.eks. Rutine for gransking av underentreprenører"
                />
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kort beskrivelse av rutinen"
                />
              </div>
              <div className="space-y-2">
                <Label>Innhold *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Skriv rutinens innhold her..."
                  rows={6}
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Dokument *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!formData.name) {
                        setFormData({ ...formData, name: file.name.replace(/\.[^/.]+$/, '') });
                      }
                    }
                  }}
                />
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Klikk for å velge PDF eller Word-dokument
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rutinenavn</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Valgfritt - bruker filnavn hvis tomt"
                />
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kort beskrivelse av rutinen"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ansvarlig rolle</Label>
              <Input
                value={formData.responsible_role}
                onChange={(e) => setFormData({ ...formData, responsible_role: e.target.value })}
                placeholder="F.eks. Prosjektleder"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreateRoutine}
              disabled={isSaving || (activeTab === 'structured' ? !formData.name || !formData.content : !selectedFile)}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Opprett rutine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link to Checklist Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Knytt til sjekklister</DialogTitle>
          </DialogHeader>
          
          {selectedRoutine && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Velg hvilke sjekklistemaler som skal knyttes til rutinen "{selectedRoutine.name}"
              </p>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen sjekklistemaler tilgjengelig
                  </p>
                ) : (
                  templates.map((template) => {
                    const isLinked = getLinkedTemplates(selectedRoutine.id).includes(template.id);
                    return (
                      <div 
                        key={template.id}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
                      >
                        <Checkbox
                          id={template.id}
                          checked={isLinked}
                          onCheckedChange={() => handleToggleLink(template.id)}
                        />
                        <label 
                          htmlFor={template.id}
                          className="flex-1 text-sm cursor-pointer"
                        >
                          {template.template_name}
                          {template.category && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {template.category}
                            </Badge>
                          )}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsLinkDialogOpen(false)}>
              Ferdig
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRoutineId} onOpenChange={() => setDeleteRoutineId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett rutine?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne rutinen? Handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteRoutineId) {
                  deleteRoutine(deleteRoutineId);
                  setDeleteRoutineId(null);
                }
              }}
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
