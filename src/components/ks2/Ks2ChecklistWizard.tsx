import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Minus,
  Camera,
  Pen,
  ClipboardCheck,
  FileText,
  Image,
  Trash2,
  Download,
  Plus,
  Edit,
} from "lucide-react";
import {
  useKsModule2Checklists,
  CHECKLIST_TEMPLATES,
  ChecklistItem,
  ChecklistTemplate,
  KsModule2Checklist,
} from "@/hooks/useKsModule2Checklists";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignaturePad } from "./SignaturePad";
import { downloadChecklistTemplatePdf } from "@/utils/ksChecklistTemplatePdf";
import UserSelect from "@/components/audits/UserSelect";
import { saveChecklistToDocumentation } from "@/utils/saveChecklistToDocumentation";
import { useAuth } from "@/contexts/AuthContext";

// Pre-selected template from Malbibliotek (admin templates)
export interface PreSelectedTemplate {
  id: string;
  template_name: string;
  category: string;
  description?: string | null;
  checkpoints: any[];
}

interface Ks2ChecklistWizardProps {
  projectId: string;
  onClose: (result?: { saved: boolean }) => void;
  preSelectedTemplate?: PreSelectedTemplate | null;
  existingChecklist?: KsModule2Checklist | null;
}

type WizardStep = "template" | "custom" | "details" | "items" | "signature" | "summary";

export function Ks2ChecklistWizard({ projectId, onClose, preSelectedTemplate, existingChecklist }: Ks2ChecklistWizardProps) {
  const { createChecklist, updateChecklist, completeChecklist, isSaving } = useKsModule2Checklists(projectId);
  const { users } = useCompanyUsers();
  const { profile } = useAuth();
  
  // Determine initial step based on whether template is pre-selected or continuing existing
  const getInitialStep = (): WizardStep => {
    if (existingChecklist) return "items";
    if (preSelectedTemplate) return "details";
    return "template";
  };
  
  const [step, setStep] = useState<WizardStep>(getInitialStep());
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [responsibleUserName, setResponsibleUserName] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [isPaper, setIsPaper] = useState(false);
  const [executeNow, setExecuteNow] = useState(true);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [inspectorSignature, setInspectorSignature] = useState<string>("");
  const [inspectorName, setInspectorName] = useState("");
  const [isEditing, setIsEditing] = useState(!!existingChecklist);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(existingChecklist?.id || null);
  
  // Track if we're using admin template (pre-selected) or built-in template
  const [isAdminTemplate, setIsAdminTemplate] = useState(!!preSelectedTemplate);
  
  // Custom checklist state
  const [isCustomChecklist, setIsCustomChecklist] = useState(false);
  const [customChecklistName, setCustomChecklistName] = useState("");
  const [customCheckpoints, setCustomCheckpoints] = useState<string[]>([""]);
  const [editingCheckpointIndex, setEditingCheckpointIndex] = useState<number | null>(null);
  
  // Project and company data for PDF generation
  const [projectData, setProjectData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  
  // Fetch project and company data for PDF generation
  useEffect(() => {
    const fetchProjectAndCompany = async () => {
      if (!projectId || !profile?.company_id) return;
      
      const [projectResult, companyResult] = await Promise.all([
        supabase.from("ks_module2_projects").select("*").eq("id", projectId).single(),
        supabase.from("companies").select("*").eq("id", profile.company_id).single(),
      ]);
      
      if (projectResult.data) setProjectData(projectResult.data);
      if (companyResult.data) setCompanyData(companyResult.data);
    };
    
    fetchProjectAndCompany();
  }, [projectId, profile?.company_id]);

  // Initialize with existing checklist if continuing
  useEffect(() => {
    if (existingChecklist) {
      setIsEditing(true);
      setEditingChecklistId(existingChecklist.id);
      setTitle(existingChecklist.title);
      setResponsibleUserId(existingChecklist.responsible_user_id || "");
      setResponsibleUserName(existingChecklist.responsible_user_name || "");
      setDeadlineDate(existingChecklist.deadline_date || "");
      setIsPaper(existingChecklist.is_paper_version);
      // Sikre at hvert punkt har en unik id, ellers vil oppdateringer (bilder, svar, kommentarer)
      // treffe alle punkter med samme/manglende id.
      const normalizedItems = (existingChecklist.checklist_items || []).map((item, idx) => ({
        ...item,
        id: item.id && String(item.id).trim() !== "" ? String(item.id) : `item-${idx + 1}`,
      }));
      // Hvis det finnes duplikate id-er, gjør dem unike
      const seen = new Set<string>();
      const uniqueItems = normalizedItems.map((item, idx) => {
        let id = item.id;
        if (seen.has(id)) id = `${id}-${idx}`;
        seen.add(id);
        return { ...item, id };
      });
      setItems(uniqueItems);
      
      // Create a "virtual" template for compatibility
      setSelectedTemplate({
        name: existingChecklist.template_name,
        category: "",
        items: uniqueItems.map(({ value, comment, photos, ...rest }) => rest),
      });
    }
  }, [existingChecklist]);

  // Auto-select logged-in user as responsible
  useEffect(() => {
    if (!existingChecklist && profile && users.length > 0 && !responsibleUserId) {
      const currentUser = users.find(u => u.id === profile.id);
      if (currentUser) {
        setResponsibleUserId(currentUser.id);
        setResponsibleUserName(`${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim());
      }
    }
  }, [profile, users, existingChecklist, responsibleUserId]);

  // Initialize with pre-selected template if provided
  useEffect(() => {
    if (preSelectedTemplate && !existingChecklist) {
      setIsAdminTemplate(true);
      setTitle(`${preSelectedTemplate.template_name} – ${format(new Date(), "dd.MM.yyyy")}`);
      
      // Convert admin template checkpoints to ChecklistItems
      const checkpoints = Array.isArray(preSelectedTemplate.checkpoints) 
        ? preSelectedTemplate.checkpoints 
        : [];
      
      const convertedItems: ChecklistItem[] = checkpoints.map((cp: any, idx: number) => ({
        id: cp.id || `${idx + 1}`,
        text: cp.checkpoint_text || cp.text || cp.label || (typeof cp === 'string' ? cp : 'Kontrollpunkt'),
        type: cp.type || "yes_no",
        required: cp.required !== false,
        value: null,
        comment: "",
        photos: [],
      }));
      
      setItems(convertedItems);
      
      // Create a "virtual" template for compatibility
      setSelectedTemplate({
        name: preSelectedTemplate.template_name,
        category: preSelectedTemplate.category,
        items: convertedItems.map(({ value, comment, photos, ...rest }) => rest),
      });
    }
  }, [preSelectedTemplate, existingChecklist]);

  const getSteps = (): WizardStep[] => {
    if (isEditing) {
      return ["items", "signature", "summary"];
    }
    if (isCustomChecklist) {
      if (isPaper || !executeNow) {
        return ["template", "custom", "details", "summary"];
      }
      return ["template", "custom", "details", "items", "signature", "summary"];
    }
    if (isPaper || !executeNow) {
      return preSelectedTemplate ? ["details", "summary"] : ["template", "details", "summary"];
    }
    return preSelectedTemplate ? ["details", "items", "signature", "summary"] : ["template", "details", "items", "signature", "summary"];
  };
  
  const steps: WizardStep[] = getSteps();
  const currentStepIndex = steps.indexOf(step);

  const handleSelectTemplate = (template: ChecklistTemplate) => {
    setIsAdminTemplate(false);
    setIsCustomChecklist(false);
    setSelectedTemplate(template);
    setTitle(`${template.name} – ${format(new Date(), "dd.MM.yyyy")}`);
    setItems(
      template.items.map((item) => ({
        ...item,
        value: null,
        comment: "",
        photos: [],
      }))
    );
    setStep("details");
  };

  const handleStartCustomChecklist = () => {
    setIsCustomChecklist(true);
    setIsAdminTemplate(false);
    setSelectedTemplate(null);
    setCustomChecklistName("");
    setCustomCheckpoints([""]);
    setStep("custom");
  };

  const handleConfirmCustomChecklist = () => {
    const validCheckpoints = customCheckpoints.filter(cp => cp.trim() !== "");
    if (!customChecklistName.trim() || validCheckpoints.length === 0) {
      toast.error("Legg til navn og minst ett kontrollpunkt");
      return;
    }
    
    const convertedItems: ChecklistItem[] = validCheckpoints.map((cp, idx) => ({
      id: `custom-${idx + 1}`,
      text: cp.trim(),
      type: "yes_no" as const,
      required: true,
      value: null,
      comment: "",
      photos: [],
    }));
    
    setItems(convertedItems);
    setTitle(`${customChecklistName} – ${format(new Date(), "dd.MM.yyyy")}`);
    setSelectedTemplate({
      name: customChecklistName,
      category: "Egendefinert",
      items: convertedItems.map(({ value, comment, photos, ...rest }) => rest),
    });
    setStep("details");
  };

  const addCustomCheckpoint = () => {
    setCustomCheckpoints([...customCheckpoints, ""]);
    setEditingCheckpointIndex(customCheckpoints.length);
  };

  const updateCustomCheckpoint = (index: number, value: string) => {
    const updated = [...customCheckpoints];
    updated[index] = value;
    setCustomCheckpoints(updated);
  };

  const removeCustomCheckpoint = (index: number) => {
    if (customCheckpoints.length > 1) {
      setCustomCheckpoints(customCheckpoints.filter((_, i) => i !== index));
    }
  };

  const handleSelectUser = (userId: string) => {
    setResponsibleUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (user) {
      setResponsibleUserName(`${user.first_name || ""} ${user.last_name || ""}`.trim());
    }
  };

  const updateItemValue = (itemId: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, value } : item))
    );
  };

  const updateItemComment = (itemId: string, comment: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, comment } : item))
    );
  };

  const handlePhotoUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingPhotoIndex(itemId);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${itemId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ks-module2-checklist-photos')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('ks-module2-checklist-photos')
          .createSignedUrl(fileName, 86400); // 24 hour expiry for display
          
        if (signedUrlError) throw signedUrlError;
        uploadedUrls.push(signedUrlData.signedUrl);
      }
      
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, photos: [...(item.photos || []), ...uploadedUrls] }
            : item
        )
      );
      
      toast.success(`${files.length} bilde(r) lastet opp`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Kunne ikke laste opp bilder');
    } finally {
      setUploadingPhotoIndex(null);
      const ref = fileInputRefs.current[itemId];
      if (ref) ref.value = '';
    }
  };

  const removePhoto = (itemId: string, photoIndex: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, photos: item.photos?.filter((_, i) => i !== photoIndex) }
          : item
      )
    );
  };

  const calculateProgress = () => {
    const answeredItems = items.filter((item) => item.value !== null && item.value !== undefined);
    return Math.round((answeredItems.length / items.length) * 100);
  };

  const handleCreate = async (isPlanned: boolean = false) => {
    if (!selectedTemplate) return;

    const uploadedByName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || "Ukjent" : "Ukjent";

    // If editing existing checklist, update it
    if (isEditing && editingChecklistId) {
      const hasSignature = !!inspectorSignature;
      const allItemsFilled = items.every(item => !item.required || (item.value !== null && item.value !== undefined));
      
      if (hasSignature && allItemsFilled) {
        // Complete the checklist
        const signatures = [{
          type: "inspector",
          name: inspectorName,
          signature: inspectorSignature,
          date: new Date().toISOString(),
        }];
        const result = await completeChecklist(editingChecklistId, items, signatures);
        if (result) {
          // Save completed checklist to documentation folder
          if (projectData && companyData && existingChecklist) {
            const completedChecklist: KsModule2Checklist = {
              ...existingChecklist,
              checklist_items: items,
              signatures,
              status: "completed",
              progress_percent: 100,
              completed_at: new Date().toISOString(),
            };
            
            const docId = await saveChecklistToDocumentation({
              checklist: completedChecklist,
              project: projectData,
              company: companyData,
              uploadedByName,
            });
            
            if (docId) {
              toast.success("Egenkontroll lagret i dokumentasjon");
            }
          }
          onClose({ saved: true });
        }
      } else {
        // Just update progress
        const answeredCount = items.filter(i => i.value !== null && i.value !== undefined).length;
        const progress = items.length > 0 ? Math.round((answeredCount / items.length) * 100) : 0;
        
        const result = await updateChecklist(editingChecklistId, {
          checklist_items: items,
          status: answeredCount > 0 ? "in_progress" : "planned",
          progress_percent: progress,
        });
        if (result) {
          onClose({ saved: true });
        }
      }
      return;
    }

    // Create new checklist
    const result = await createChecklist({
      title,
      template_name: selectedTemplate.name,
      responsible_user_id: responsibleUserId || undefined,
      responsible_user_name: responsibleUserName || undefined,
      deadline_date: deadlineDate || undefined,
      checklist_items: isPlanned ? items.map(item => ({ ...item, value: null })) : items,
      is_paper_version: isPaper,
      inspector_signature: isPlanned ? undefined : (inspectorSignature || undefined),
      inspector_name: isPlanned ? undefined : (inspectorName || undefined),
    });

    if (result) {
      // If it's a completed checklist (not planned), save to documentation
      const hasSignature = !!inspectorSignature;
      const allItemsFilled = items.every(item => !item.required || (item.value !== null && item.value !== undefined));
      
      if (!isPlanned && hasSignature && allItemsFilled && projectData && companyData) {
        const docId = await saveChecklistToDocumentation({
          checklist: result,
          project: projectData,
          company: companyData,
          uploadedByName,
        });
        
        if (docId) {
          toast.success("Egenkontroll lagret i dokumentasjon");
        }
      }
      onClose({ saved: true });
    }
  };

  const groupedTemplates = CHECKLIST_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ChecklistTemplate[]>);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose({ saved: false }); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {isEditing ? `Fortsett: ${title}` : "Ny egenkontroll"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Steg {currentStepIndex + 1} av {steps.length}</span>
            <span className="text-muted-foreground">
              {step === "template" && "Velg mal"}
              {step === "custom" && "Lag sjekkliste"}
              {step === "details" && "Detaljer"}
              {step === "items" && "Fyll ut punkter"}
              {step === "signature" && "Signatur"}
              {step === "summary" && "Oppsummering"}
            </span>
          </div>
          <Progress value={((currentStepIndex + 1) / steps.length) * 100} />
        </div>

        {/* Step: Template */}
        {step === "template" && (
          <div className="space-y-6">
            <p className="text-muted-foreground">Velg en mal for egenkontroll:</p>
            
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category}>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <Card
                      key={template.name}
                      className={cn(
                        "cursor-pointer hover:border-primary transition-colors",
                        selectedTemplate?.name === template.name && "border-primary bg-primary/5"
                      )}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {template.items.length} kontrollpunkter
                            </p>
                          </div>
                          <Badge variant="outline">{category}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom checklist option */}
            <Card className="border-dashed border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Edit className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-medium">Lag egen sjekkliste</h4>
                    <p className="text-sm text-muted-foreground">
                      Opprett en tilpasset sjekkliste med egne kontrollpunkter
                    </p>
                  </div>
                  <Button onClick={handleStartCustomChecklist}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lag ny
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Paper version option */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <h4 className="font-medium">Bruk papirversjon</h4>
                    <p className="text-sm text-muted-foreground">
                      Last ned PDF-mal, fyll ut på papir, og last opp skannet versjon etterpå
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPaper(true);
                      if (CHECKLIST_TEMPLATES[0]) {
                        handleSelectTemplate(CHECKLIST_TEMPLATES[0]);
                      }
                    }}
                  >
                    Velg papir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Custom */}
        {step === "custom" && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Opprett en egendefinert sjekkliste med dine egne kontrollpunkter.
            </p>
            
            <div>
              <Label>Navn på sjekkliste *</Label>
              <Input 
                placeholder="F.eks. Kontroll av betongstøp"
                value={customChecklistName}
                onChange={(e) => setCustomChecklistName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Kontrollpunkter *</Label>
              <p className="text-sm text-muted-foreground">
                Legg til punktene som skal kontrolleres
              </p>
              
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {customCheckpoints.map((checkpoint, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder="Beskriv kontrollpunktet..."
                      value={checkpoint}
                      onChange={(e) => updateCustomCheckpoint(index, e.target.value)}
                      autoFocus={editingCheckpointIndex === index}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomCheckpoint(index)}
                      disabled={customCheckpoints.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={addCustomCheckpoint}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Legg til kontrollpunkt
              </Button>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCustomChecklist(false);
                setStep("template");
              }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleConfirmCustomChecklist}
                disabled={!customChecklistName.trim() || customCheckpoints.filter(cp => cp.trim()).length === 0}
              >
                Fortsett til detaljer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="space-y-4">
            <div>
              <Label>Tittel *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Ansvarlig</Label>
              <Select value={responsibleUserId} onValueChange={handleSelectUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg ansvarlig..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Frist</Label>
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
              />
            </div>

            {/* Execute now or later choice */}
            {!isPaper && (
              <div className="pt-2">
                <Label className="mb-3 block">Når skal kontrollen utføres?</Label>
                <RadioGroup
                  value={executeNow ? "now" : "later"}
                  onValueChange={(v) => setExecuteNow(v === "now")}
                  className="space-y-3"
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-colors",
                      executeNow && "border-primary bg-primary/5"
                    )}
                    onClick={() => setExecuteNow(true)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <RadioGroupItem value="now" id="execute-now" />
                      <div className="flex-1">
                        <Label htmlFor="execute-now" className="font-medium cursor-pointer">
                          Utfør nå
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Fyll ut kontrollpunktene med en gang
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card 
                    className={cn(
                      "cursor-pointer transition-colors",
                      !executeNow && "border-primary bg-primary/5"
                    )}
                    onClick={() => setExecuteNow(false)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <RadioGroupItem value="later" id="execute-later" />
                      <div className="flex-1">
                        <Label htmlFor="execute-later" className="font-medium cursor-pointer">
                          Planlegg til senere
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Opprett kontrollen og fyll ut når det passer
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </div>
            )}

            {isPaper && (
              <Card className="bg-orange-500/10 border-orange-500/20">
                <CardContent className="p-4">
                  <p className="text-sm">
                    <strong>Papirversjon:</strong> Etter opprettelse kan du laste ned PDF-malen,
                    fylle ut på papir, og laste opp det skannede skjemaet.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(isCustomChecklist ? "custom" : "template")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              {!executeNow && !isPaper ? (
                <Button
                  className="flex-1"
                  onClick={() => handleCreate(true)}
                  disabled={!title || isSaving}
                >
                  {isSaving ? "Lagrer..." : "Opprett og planlegg"}
                  <Check className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={() => setStep(isPaper ? "summary" : "items")}
                  disabled={!title}
                >
                  {isPaper ? "Gå til oppsummering" : "Fyll ut punkter"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step: Items */}
        {step === "items" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Fyll ut kontrollpunktene nedenfor
              </p>
              <Badge>{calculateProgress()}% utfylt</Badge>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {items.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <div className="flex-1 space-y-3">
                        <p className="font-medium">
                          {item.text}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </p>

                        {item.type === "yes_no" && (
                          <RadioGroup
                            value={item.value === true ? "yes" : item.value === false ? "no" : item.value === "na" ? "na" : ""}
                            onValueChange={(v) => updateItemValue(item.id, v === "yes" ? true : v === "no" ? false : "na")}
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="yes" id={`${item.id}-yes`} />
                              <Label htmlFor={`${item.id}-yes`} className="flex items-center gap-1 cursor-pointer">
                                <Check className="h-4 w-4 text-green-500" /> Ja
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="no" id={`${item.id}-no`} />
                              <Label htmlFor={`${item.id}-no`} className="flex items-center gap-1 cursor-pointer">
                                <X className="h-4 w-4 text-red-500" /> Nei
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="na" id={`${item.id}-na`} />
                              <Label htmlFor={`${item.id}-na`} className="flex items-center gap-1 cursor-pointer">
                                <Minus className="h-4 w-4" /> N/A
                              </Label>
                            </div>
                          </RadioGroup>
                        )}

                        {item.type === "number" && (
                          <Input
                            type="number"
                            placeholder="Skriv inn verdi..."
                            value={item.value as number || ""}
                            onChange={(e) => updateItemValue(item.id, parseFloat(e.target.value) || null)}
                            className="max-w-[200px]"
                          />
                        )}

                        {item.type === "text" && (
                          <Textarea
                            placeholder="Skriv inn tekst..."
                            value={item.value as string || ""}
                            onChange={(e) => updateItemValue(item.id, e.target.value)}
                          />
                        )}

                        {item.type === "photo" && (
                          <div className="space-y-2">
                            {/* Camera input - for taking photos */}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              multiple
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                              className="hidden"
                              id={`photo-camera-${item.id}`}
                            />
                            {/* Gallery input - for uploading existing photos */}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                              className="hidden"
                              id={`photo-gallery-${item.id}`}
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`photo-camera-${item.id}`)?.click()}
                                disabled={uploadingPhotoIndex === item.id}
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                {uploadingPhotoIndex === item.id ? "Laster opp..." : "Ta bilde"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`photo-gallery-${item.id}`)?.click()}
                                disabled={uploadingPhotoIndex === item.id}
                              >
                                <Image className="h-4 w-4 mr-2" />
                                Last opp
                              </Button>
                              {item.required && !item.photos?.length && (
                                <span className="text-xs text-red-500">Obligatorisk bilde</span>
                              )}
                            </div>
                            
                            {item.photos && item.photos.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {item.photos.map((url, photoIndex) => (
                                  <div key={photoIndex} className="relative group">
                                    <img
                                      src={url}
                                      alt={`Bilde ${photoIndex + 1}`}
                                      className="w-16 h-16 object-cover rounded-md border"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removePhoto(item.id, photoIndex)}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {item.type === "signature" && (
                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            <Pen className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Klikk for å signere
                            </p>
                          </div>
                        )}

                        {/* Photo attachment option for all types */}
                        {item.type !== "photo" && (
                          <div className="pt-2 border-t mt-2">
                            {/* Camera input - for taking photos */}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              multiple
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                              className="hidden"
                              id={`extra-camera-${item.id}`}
                            />
                            {/* Gallery input - for uploading existing photos */}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                              className="hidden"
                              id={`extra-gallery-${item.id}`}
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => document.getElementById(`extra-camera-${item.id}`)?.click()}
                                disabled={uploadingPhotoIndex === item.id}
                                className="text-muted-foreground"
                              >
                                <Camera className="h-4 w-4 mr-1" />
                                Ta bilde
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => document.getElementById(`extra-gallery-${item.id}`)?.click()}
                                disabled={uploadingPhotoIndex === item.id}
                                className="text-muted-foreground"
                              >
                                <Image className="h-4 w-4 mr-1" />
                                Last opp
                              </Button>
                              {item.photos && item.photos.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {item.photos.length} bilde(r)
                                </Badge>
                              )}
                            </div>
                            
                            {item.photos && item.photos.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {item.photos.map((url, photoIndex) => (
                                  <div key={photoIndex} className="relative group">
                                    <img
                                      src={url}
                                      alt={`Bilde ${photoIndex + 1}`}
                                      className="w-12 h-12 object-cover rounded-md border"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removePhoto(item.id, photoIndex)}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <Input
                          placeholder="Kommentar (valgfritt)..."
                          value={item.comment || ""}
                          onChange={(e) => updateItemComment(item.id, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("details")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Button className="flex-1" onClick={() => setStep("signature")}>
                Gå til signering
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Signature */}
        {step === "signature" && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Signer for å bekrefte at kontrollen er utført korrekt.
            </p>

            <div className="space-y-2">
              <Label>Ditt navn</Label>
              <UserSelect
                value={inspectorName}
                onValueChange={setInspectorName}
                placeholder="Velg eller skriv inn navn..."
              />
            </div>

            <SignaturePad
              label="Din signatur"
              onSave={setInspectorSignature}
              onClear={() => setInspectorSignature("")}
              existingSignature={inspectorSignature}
            />

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("items")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => setStep("summary")}
                disabled={!inspectorSignature || !inspectorName}
              >
                Gå til oppsummering
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Summary */}
        {step === "summary" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mal</span>
                  <span className="font-medium">{selectedTemplate?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tittel</span>
                  <span className="font-medium">{title}</span>
                </div>
                {responsibleUserName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ansvarlig</span>
                    <span className="font-medium">{responsibleUserName}</span>
                  </div>
                )}
                {deadlineDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frist</span>
                    <span className="font-medium">{deadlineDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant={isPaper ? "outline" : "default"}>
                    {isPaper ? "Papirversjon" : "Digital"}
                  </Badge>
                </div>
                {!isPaper && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utfylt</span>
                      <span className="font-medium">{calculateProgress()}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bilder</span>
                      <span className="font-medium">
                        {items.reduce((sum, item) => sum + (item.photos?.length || 0), 0)} stk
                      </span>
                    </div>
                    {inspectorName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Signert av</span>
                        <span className="font-medium flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          {inspectorName}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {isPaper && selectedTemplate && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Download className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <h4 className="font-medium">Last ned papirmal</h4>
                      <p className="text-sm text-muted-foreground">
                        Last ned PDF-malen, skriv ut og fyll ut på byggeplassen
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        downloadChecklistTemplatePdf({
                          title,
                          templateName: selectedTemplate.name,
                          responsibleName: responsibleUserName || undefined,
                          deadlineDate: deadlineDate || undefined,
                          items: selectedTemplate.items,
                        });
                        toast.success("PDF lastet ned");
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Last ned PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(isPaper ? "details" : "signature")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Button className="flex-1" onClick={() => handleCreate(false)} disabled={isSaving}>
                {isSaving ? "Oppretter..." : isPaper ? "Opprett og venter på opplasting" : "Fullfør og lagre"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}