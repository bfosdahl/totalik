import { useState, useRef } from "react";
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
} from "lucide-react";
import {
  useKsModule2Checklists,
  CHECKLIST_TEMPLATES,
  ChecklistItem,
  ChecklistTemplate,
} from "@/hooks/useKsModule2Checklists";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Ks2ChecklistWizardProps {
  projectId: string;
  onClose: () => void;
}

type WizardStep = "template" | "details" | "items" | "summary";

export function Ks2ChecklistWizard({ projectId, onClose }: Ks2ChecklistWizardProps) {
  const { createChecklist, isSaving } = useKsModule2Checklists(projectId);
  const { users } = useCompanyUsers();
  const [step, setStep] = useState<WizardStep>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [responsibleUserName, setResponsibleUserName] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [isPaper, setIsPaper] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const steps: WizardStep[] = ["template", "details", "items", "summary"];
  const currentStepIndex = steps.indexOf(step);

  const handleSelectTemplate = (template: ChecklistTemplate) => {
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
        
        const { data: urlData } = supabase.storage
          .from('ks-module2-checklist-photos')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(urlData.publicUrl);
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

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    const result = await createChecklist({
      title,
      template_name: selectedTemplate.name,
      responsible_user_id: responsibleUserId || undefined,
      responsible_user_name: responsibleUserName || undefined,
      deadline_date: deadlineDate || undefined,
      checklist_items: items,
      is_paper_version: isPaper,
    });

    if (result) {
      onClose();
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Ny egenkontroll
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Steg {currentStepIndex + 1} av {steps.length}</span>
            <span className="text-muted-foreground">
              {step === "template" && "Velg mal"}
              {step === "details" && "Detaljer"}
              {step === "items" && "Fyll ut punkter"}
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
              <Button variant="outline" onClick={() => setStep("template")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep(isPaper ? "summary" : "items")}
                disabled={!title}
              >
                {isPaper ? "Gå til oppsummering" : "Fyll ut punkter"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
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
                            <input
                              ref={(el) => { fileInputRefs.current[item.id] = el; }}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                              className="hidden"
                              id={`photo-upload-${item.id}`}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[item.id]?.click()}
                                disabled={uploadingPhotoIndex === item.id}
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                {uploadingPhotoIndex === item.id ? "Laster opp..." : "Ta bilde"}
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
                            <input
                              ref={(el) => { fileInputRefs.current[`${item.id}-extra`] = el; }}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                              className="hidden"
                              id={`photo-upload-extra-${item.id}`}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRefs.current[`${item.id}-extra`]?.click()}
                                disabled={uploadingPhotoIndex === item.id}
                                className="text-muted-foreground"
                              >
                                <Image className="h-4 w-4 mr-1" />
                                Legg til bilde
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
              <Button className="flex-1" onClick={() => setStep("summary")}>
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
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(isPaper ? "details" : "items")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={isSaving}>
                {isSaving ? "Oppretter..." : isPaper ? "Opprett (papirversjon)" : "Fullfør og lagre"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}