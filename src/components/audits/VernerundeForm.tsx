import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  FileDown, 
  Loader2,
  Calendar,
  Users,
  AlertTriangle,
  Pen,
  ShieldCheck,
  ArrowLeft,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import SavedFormsList from "./SavedFormsList";
import { SignaturePad } from "@/components/ks2/SignaturePad";
import { useAuditFormResponses, type AuditFormResponse } from "@/hooks/useAuditFormResponses";
import { useHmsVernerundeTemplates, HmsVernerundeTemplate, VernerundeCheckpoint } from "@/hooks/useHmsVernerundeTemplates";
import VernerundeTemplateSelector from "./vernerunde/VernerundeTemplateSelector";
import CustomVernerundeBuilder from "./vernerunde/CustomVernerundeBuilder";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const getDefaultFormData = () => ({
  dato: format(new Date(), "yyyy-MM-dd"),
  avdeling: "",
  deltakere: "",
  checklist: {} as Record<string, boolean>,
  comments: {} as Record<string, string>,
  avvik: "",
  tiltak: "",
  ansvarligOppfolging: "",
  fristTiltak: "",
  signVerneombud: "",
  signLeder: "",
  templateId: "",
  templateName: "",
});

const VernerundeForm = () => {
  const { profile } = useAuth();
  const { templates, isLoading: templatesLoading } = useHmsVernerundeTemplates();
  const { 
    responses, 
    saveFormResponse, 
    deleteFormResponse, 
    isSaving,
  } = useAuditFormResponses();

  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<HmsVernerundeTemplate | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isBuildingCustom, setIsBuildingCustom] = useState(false);
  
  // Filter responses for vernerunde only
  const vernerundeResponses = responses.filter(r => r.form_type === "vernerunde");
  
  // Form state
  const [formData, setFormData] = useState(getDefaultFormData);

  // Group checkpoints by category
  const checkpointsByCategory = useMemo(() => {
    if (!selectedTemplate) return {};
    
    const grouped: Record<string, VernerundeCheckpoint[]> = {};
    selectedTemplate.checkpoints.forEach(cp => {
      if (!grouped[cp.category]) {
        grouped[cp.category] = [];
      }
      grouped[cp.category].push(cp);
    });
    return grouped;
  }, [selectedTemplate]);

  const categories = Object.keys(checkpointsByCategory);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAllCategories = () => {
    setExpandedCategories(new Set(categories));
  };

  const handleSelectTemplate = (template: HmsVernerundeTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      templateId: template.id,
      templateName: template.template_name,
      checklist: {},
      comments: {},
    }));
    // Expand all categories by default
    setExpandedCategories(new Set(template.checkpoints.map(cp => cp.category)));
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setSelectedFormId(null);
    setFormData(getDefaultFormData());
    setExpandedCategories(new Set());
    setIsBuildingCustom(false);
  };

  const handleCheckboxChange = (checkpointId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [checkpointId]: checked,
      },
    }));
  };

  const handleCommentChange = (checkpointId: string, comment: string) => {
    setFormData((prev) => ({
      ...prev,
      comments: {
        ...prev.comments,
        [checkpointId]: comment,
      },
    }));
  };

  const handleSignatureSave = (field: "signVerneombud" | "signLeder", signature: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: signature,
    }));
  };

  const handleSave = async () => {
    const result = await saveFormResponse(
      "vernerunde",
      formData,
      {
        participants: formData.deltakere,
      },
      "draft",
      selectedFormId || undefined
    );
    if (result) {
      setSelectedFormId(result.id);
    }
  };

  const handleComplete = async () => {
    const result = await saveFormResponse(
      "vernerunde",
      formData,
      {
        participants: formData.deltakere,
      },
      "completed",
      selectedFormId || undefined
    );
    if (result) {
      // Reset form after completion
      setSelectedFormId(null);
      setSelectedTemplate(null);
      setFormData(getDefaultFormData());
      setExpandedCategories(new Set());
    }
  };

  const handleLoadForm = (response: AuditFormResponse) => {
    setSelectedFormId(response.id);
    const data = response.form_data as any;
    
    // Find and set the template if templateId exists
    if (data.templateId) {
      const template = templates.find(t => t.id === data.templateId);
      if (template) {
        setSelectedTemplate(template);
        setExpandedCategories(new Set(template.checkpoints.map(cp => cp.category)));
      }
    }
    
    setFormData({
      dato: data.dato || format(new Date(), "yyyy-MM-dd"),
      avdeling: data.avdeling || "",
      deltakere: data.deltakere || "",
      checklist: data.checklist || {},
      comments: data.comments || {},
      avvik: data.avvik || "",
      tiltak: data.tiltak || "",
      ansvarligOppfolging: data.ansvarligOppfolging || "",
      fristTiltak: data.fristTiltak || "",
      signVerneombud: data.signVerneombud || "",
      signLeder: data.signLeder || "",
      templateId: data.templateId || "",
      templateName: data.templateName || "",
    });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    await deleteFormResponse(id);
    if (selectedFormId === id) {
      setSelectedFormId(null);
      setSelectedTemplate(null);
      setFormData(getDefaultFormData());
    }
    setIsDeleting(false);
  };

  const handleCreateNew = () => {
    setSelectedFormId(null);
    setSelectedTemplate(null);
    setFormData(getDefaultFormData());
    setExpandedCategories(new Set());
    setIsBuildingCustom(false);
  };

  const completedCount = selectedTemplate 
    ? Object.values(formData.checklist).filter(Boolean).length
    : 0;
  const totalCount = selectedTemplate?.checkpoints.length || 0;

  const getCategoryProgress = (category: string) => {
    const categoryCheckpoints = checkpointsByCategory[category] || [];
    const completed = categoryCheckpoints.filter(cp => formData.checklist[cp.id]).length;
    return { completed, total: categoryCheckpoints.length };
  };

  return (
    <div className="space-y-6">
      {/* Saved Forms List */}
      <SavedFormsList
        responses={vernerundeResponses}
        onDelete={handleDelete}
        onSelect={handleLoadForm}
        onCreateNew={handleCreateNew}
        isDeleting={isDeleting}
        title="Lagrede vernerunder"
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {selectedTemplate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToTemplates}
                    className="shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>
                    {selectedFormId 
                      ? "Rediger vernerunde" 
                      : selectedTemplate 
                        ? selectedTemplate.template_name
                        : "Ny vernerunde – Velg sjekkliste"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTemplate 
                      ? selectedTemplate.description || "Systematisk gjennomgang av arbeidsmiljøet"
                      : "Velg hvilken type vernerunde du skal utføre"}
                  </p>
                </div>
              </div>
              {selectedTemplate && (
                <Badge variant="outline" className="text-sm">
                  {completedCount} / {totalCount} punkter
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedTemplate ? (
              <VernerundeTemplateSelector
                templates={templates}
                isLoading={templatesLoading}
                onSelectTemplate={handleSelectTemplate}
              />
            ) : (
              <>
                {/* Generell informasjon */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Generell informasjon
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Dato for vernerunde</Label>
                      <Input
                        type="date"
                        value={formData.dato}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dato: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Avdeling / område</Label>
                      <Input
                        placeholder="F.eks. Lager, Kontor, Verksted"
                        value={formData.avdeling}
                        onChange={(e) => setFormData((prev) => ({ ...prev, avdeling: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Deltakere (navn / roller)</Label>
                    <Textarea
                      placeholder="F.eks. Ola Nordmann (Verneombud), Kari Hansen (Leder)"
                      value={formData.deltakere}
                      onChange={(e) => setFormData((prev) => ({ ...prev, deltakere: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                {/* Checklist Sections by Category */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Sjekkpunkter</h3>
                    <Button variant="ghost" size="sm" onClick={expandAllCategories}>
                      Utvid alle
                    </Button>
                  </div>
                  
                  {categories.map((category, categoryIndex) => {
                    const progress = getCategoryProgress(category);
                    const isExpanded = expandedCategories.has(category);
                    
                    return (
                      <Collapsible
                        key={category}
                        open={isExpanded}
                        onOpenChange={() => toggleCategory(category)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">
                                {categoryIndex + 1}. {category}
                              </span>
                            </div>
                            <Badge 
                              variant={progress.completed === progress.total && progress.total > 0 ? "default" : "outline"} 
                              className="text-xs"
                            >
                              {progress.completed} / {progress.total}
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-3 pt-3 pl-7">
                            {checkpointsByCategory[category].map((checkpoint) => (
                              <div key={checkpoint.id} className="space-y-2 p-3 rounded-lg border bg-background">
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={checkpoint.id}
                                    checked={formData.checklist[checkpoint.id] || false}
                                    onCheckedChange={(checked) =>
                                      handleCheckboxChange(checkpoint.id, checked as boolean)
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 space-y-2">
                                    <Label
                                      htmlFor={checkpoint.id}
                                      className="text-sm font-normal leading-relaxed cursor-pointer"
                                    >
                                      {checkpoint.checkpoint}
                                    </Label>
                                    {checkpoint.help_text && (
                                      <p className="text-xs text-muted-foreground">
                                        {checkpoint.help_text}
                                      </p>
                                    )}
                                    <Input
                                      placeholder="Kommentar / merknad..."
                                      value={formData.comments[checkpoint.id] || ""}
                                      onChange={(e) => handleCommentChange(checkpoint.id, e.target.value)}
                                      className="text-sm h-8"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>

                <Separator />

                {/* Avvik og tiltak */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Avvik, forbedringsforslag og tiltak
                  </h3>
                  <div>
                    <Label>Observerte avvik / farer / uønskede forhold</Label>
                    <Textarea
                      placeholder="Beskriv eventuelle avvik som ble observert..."
                      rows={4}
                      value={formData.avvik}
                      onChange={(e) => setFormData((prev) => ({ ...prev, avvik: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Forslag til tiltak / forbedringer</Label>
                    <Textarea
                      placeholder="Beskriv forslag til tiltak..."
                      rows={4}
                      value={formData.tiltak}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tiltak: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Ansvarlig for oppfølging</Label>
                      <Input
                        placeholder="Navn / rolle"
                        value={formData.ansvarligOppfolging}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ansvarligOppfolging: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Frist for gjennomføring av tiltak</Label>
                      <Input
                        type="date"
                        value={formData.fristTiltak}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fristTiltak: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Signaturer */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Pen className="w-5 h-5" />
                    Signatur
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block">Verneombud / representant</Label>
                      <SignaturePad
                        onSave={(sig) => handleSignatureSave("signVerneombud", sig)}
                        existingSignature={formData.signVerneombud}
                        label="Verneombud"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Leder / ansvarlig</Label>
                      <SignaturePad
                        onSave={(sig) => handleSignatureSave("signLeder", sig)}
                        existingSignature={formData.signLeder}
                        label="Leder"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Lagre utkast
                  </Button>
                  <Button onClick={handleComplete} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                    Fullfør vernerunde
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VernerundeForm;
