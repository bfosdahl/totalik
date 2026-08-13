import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Upload, 
  Plus, 
  Pencil, 
  ExternalLink,
  Users,
  FileCheck,
  ClipboardList,
  Shield,
  CheckCircle,
  Mail,
  Settings,
  ChevronDown,
  ChevronRight,
  Search
} from "lucide-react";
import { useByggesakTemplates, ByggesakTemplate } from "@/hooks/useKsModule2Byggesak";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  nabovarsel: { label: t("auto.nabovarsel"), icon: Mail, color: "bg-blue-500" },
  soknad: { label: t("auto.soeknader"), icon: FileText, color: "bg-emerald-500" },
  ansvarsrett: { label: t("auto.ansvarsrett"), icon: Users, color: "bg-purple-500" },
  plan: { label: t("auto.planer"), icon: ClipboardList, color: "bg-amber-500" },
  kontroll: { label: t("auto.kontroll"), icon: Shield, color: "bg-cyan-500" },
  ferdigattest: { label: t("auto.ferdigattest"), icon: CheckCircle, color: "bg-green-500" },
  melding: { label: t("auto.meldinger"), icon: FileCheck, color: "bg-orange-500" },
  annet: { label: t("auto.annet"), icon: Settings, color: "bg-gray-500" },
};

export default function AdminByggesakTemplates() {
  const { data: templates, isLoading } = useByggesakTemplates();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<ByggesakTemplate | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const updateTemplate = useMutation({
    mutationFn: async (data: Partial<ByggesakTemplate> & { id: string }) => {
      const { id, ...update } = data;
      const { error } = await supabase
        .from("admin_byggesak_templates")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["byggesak-templates"] });
      toast.success(t("auto.mal_oppdatert"));
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error(t("auto.kunne_ikke_oppdatere_mal"));
    },
  });

  const uploadPdf = async (templateId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${templateId}.${fileExt}`;
    const filePath = `templates/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("byggesak-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error(t("auto.kunne_ikke_laste_opp_fil"));
      return;
    }

    await updateTemplate.mutateAsync({
      id: templateId,
      pdf_file_path: filePath,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  // Group by category
  const byCategory = (templates || []).reduce((acc, t) => {
    if (!acc[t.form_category]) acc[t.form_category] = [];
    acc[t.form_category].push(t);
    return acc;
  }, {} as Record<string, ByggesakTemplate[]>);

  const getTemplateCount = (category: string) => {
    return byCategory[category]?.length || 0;
  };

  const getUploadedCount = (category: string) => {
    return byCategory[category]?.filter(t => t.pdf_file_path).length || 0;
  };

  const stats = {
    totalTemplates: templates?.length || 0,
    uploadedPdfs: templates?.filter(t => t.pdf_file_path).length || 0,
    activeCategories: Object.keys(byCategory).length,
  };

  // Filter templates
  const filteredCategories = Object.entries(byCategory).filter(([category, categoryTemplates]) => {
    if (categoryFilter !== "all" && category !== categoryFilter) return false;
    if (searchQuery) {
      return categoryTemplates.some(t => 
        t.form_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.form_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-emerald-500">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("auto.byggesak_maler")}</h1>
              <p className="text-muted-foreground">
                {t("auto.offisielle_blanketter_og_skjemaer_fra_di")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                System Admin
              </Badge>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("auto.legg_til_mal")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-emerald-600">{stats.totalTemplates}</div>
            <div className="text-sm text-muted-foreground">{t("auto.totalt_maler")}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-blue-600">{stats.uploadedPdfs}</div>
            <div className="text-sm text-muted-foreground">{t("auto.pdf_er_lastet_opp")}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-purple-600">{stats.activeCategories}</div>
            <div className="text-sm text-muted-foreground">{t("auto.kategorier_med_innhold")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("auto.soek_i_maler")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("auto.alle_kategorier")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("auto.alle_kategorier")}</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* External Links */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="https://dibk.no/byggeregler/skjema/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            DIBK Skjemaoversikt
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="https://www.altinn.no/skjemaoversikt/?FormsCategory=3754" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Altinn Byggesak
          </a>
        </Button>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(CATEGORY_CONFIG).map(([categoryKey, config]) => {
          const Icon = config.icon;
          const templateCount = getTemplateCount(categoryKey);
          const uploadedCount = getUploadedCount(categoryKey);
          const isExpanded = expandedCategory === categoryKey;
          const categoryTemplates = byCategory[categoryKey] || [];

          // Skip if filtered out
          if (categoryFilter !== "all" && categoryFilter !== categoryKey) return null;
          if (searchQuery && !categoryTemplates.some(t => 
            t.form_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.form_number.toLowerCase().includes(searchQuery.toLowerCase())
          )) return null;

          return (
            <Card 
              key={categoryKey}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2",
                isExpanded ? "border-emerald-500 ring-2 ring-emerald-500/20 col-span-1 sm:col-span-2 md:col-span-4" : "border-transparent"
              )}
              onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn("p-4 rounded-xl", config.color)}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{config.label}</h3>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {templateCount > 0 
                        ? `${templateCount} skjemaer tilgjengelig` 
                        : "Ingen skjemaer"
                      }
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {templateCount} maler
                      </Badge>
                      {uploadedCount > 0 && (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                          {uploadedCount} PDF
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Template List */}
                {isExpanded && categoryTemplates.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                    {categoryTemplates.map(template => (
                      <div 
                        key={template.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Badge variant="secondary" className="shrink-0">{template.form_number}</Badge>
                          <span className="font-medium truncate">{template.form_name}</span>
                          {template.pdf_file_path && (
                            <Badge variant="outline" className="text-xs gap-1 shrink-0">
                              <FileText className="h-3 w-3" />
                              PDF
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={(checked) => 
                              updateTemplate.mutate({ id: template.id, is_active: checked })
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <label onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" asChild>
                              <span><Upload className="h-4 w-4" /></span>
                            </Button>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadPdf(template.id, file);
                              }}
                            />
                          </label>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemplate(template);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {!isExpanded && (
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCategory(categoryKey);
                      }}
                    >
                      <Upload className="h-4 w-4" />
                      Administrer maler
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auto.rediger_mal")}</DialogTitle>
            <DialogDescription>
              {t("auto.oppdater_informasjon_om_blanketten")}
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label>{t("auto.skjemanummer")}</Label>
                <Input value={editingTemplate.form_number} disabled />
              </div>
              <div>
                <Label>{t("auto.navn_2")}</Label>
                <Input 
                  value={editingTemplate.form_name}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    form_name: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>{t("auto.beskrivelse")}</Label>
                <Input 
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    description: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>{t("auto.versjon")}</Label>
                <Input 
                  value={editingTemplate.version || ""}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    version: e.target.value
                  })}
                  placeholder={t("auto.f_eks_2024_tek17")}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              {t("auto.avbryt")}
            </Button>
            <Button 
              onClick={() => editingTemplate && updateTemplate.mutate(editingTemplate)}
              disabled={updateTemplate.isPending}
            >
              {t("auto.lagre")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
