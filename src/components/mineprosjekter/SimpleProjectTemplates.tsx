import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Download, FileText, CheckSquare, Loader2, ChevronRight,
  FolderOpen, Hammer, Droplets, Box, Home, Layers, Mountain,
  ClipboardCheck, FolderCog, Users, Shield, Settings, FileCheck,
  Cog, AlertTriangle, BookText, GraduationCap, Search, Building,
  FileSignature, Scale, Bell, Wrench
} from "lucide-react";
import { useAdminTemplatesForCustomers } from "@/hooks/useAdminTemplatesForCustomers";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n/t";

interface SimpleProjectTemplatesProps {
  projectId: string;
}

const CHECKLIST_CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  tomrerarbeid: { label: t("auto.toemrerarbeid"), icon: Hammer, color: "bg-amber-500" },
  vatrom: { label: t("auto.vaatrom"), icon: Droplets, color: "bg-blue-500" },
  betong: { label: t("auto.betong"), icon: Box, color: "bg-slate-500" },
  tak: { label: t("auto.tak"), icon: Home, color: "bg-orange-500" },
  fasade: { label: t("auto.fasade"), icon: Layers, color: "bg-emerald-500" },
  grunn: { label: t("auto.grunn_og_fundamenter"), icon: Mountain, color: "bg-stone-500" },
  sluttkontroll: { label: t("auto.sluttkontroll"), icon: ClipboardCheck, color: "bg-green-500" },
  forprosjekt: { label: t("auto.foerprosjekt"), icon: FolderCog, color: "bg-purple-500" },
  underentreprenor: { label: t("auto.underentreprenoer"), icon: Users, color: "bg-indigo-500" },
  uk: { label: t("auto.uavhengig_kontroll"), icon: Shield, color: "bg-red-500" },
  general: { label: t("auto.generelt"), icon: Settings, color: "bg-gray-500" },
};

const ROUTINE_CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  kvalitetssikring: { label: t("auto.kvalitetssikring_generelt"), icon: FileCheck, color: "bg-blue-500" },
  avvikshåndtering: { label: t("auto.avvikshaandtering"), icon: AlertTriangle, color: "bg-amber-500" },
  dokumentstyring: { label: t("auto.dokumentstyring"), icon: BookText, color: "bg-purple-500" },
  underentreprenor: { label: t("auto.underentreprenoerkontroll"), icon: Users, color: "bg-indigo-500" },
  hms: { label: t("auto.hms_paa_byggeplass"), icon: Shield, color: "bg-green-500" },
  opplæring: { label: t("auto.opplaering"), icon: GraduationCap, color: "bg-cyan-500" },
  kontroll: { label: t("auto.kontroll"), icon: Search, color: "bg-orange-500" },
  general: { label: t("auto.generelt"), icon: Cog, color: "bg-gray-500" },
};

const DOCUMENT_CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  checklist: { label: t("auto.sjekkliste_mal"), icon: CheckSquare, color: "bg-blue-500" },
  form: { label: t("auto.skjema"), icon: FileText, color: "bg-purple-500" },
  routine: { label: t("auto.rutine"), icon: BookText, color: "bg-emerald-500" },
  building_case: { label: t("auto.byggesak"), icon: Building, color: "bg-amber-500" },
  contract: { label: t("auto.kontrakt"), icon: FileSignature, color: "bg-indigo-500" },
  samsvar: { label: t("auto.samsvarserklaering"), icon: Scale, color: "bg-green-500" },
  nabovarsel: { label: t("auto.nabovarsel"), icon: Bell, color: "bg-orange-500" },
  fdv: { label: "FDV", icon: Wrench, color: "bg-cyan-500" },
  other: { label: t("auto.annet"), icon: FolderOpen, color: "bg-gray-500" },
};

export function SimpleProjectTemplates({ projectId }: SimpleProjectTemplatesProps) {
  const { checklistTemplates, routineTemplates, documents, isLoading, getDocumentUrl } = useAdminTemplatesForCustomers();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDownloadDocument = async (filePath: string, fileName: string, docId: string) => {
    try {
      setDownloadingId(docId);
      const url = await getDocumentUrl(filePath);
      if (url) {
        window.open(url, "_blank");
        toast.success(t("auto.dokument_aapnet"));
      } else {
        toast.error(t("auto.kunne_ikke_hente_dokument"));
      }
    } catch (error) {
      toast.error(t("auto.kunne_ikke_laste_ned_dokument"));
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter by search
  const filteredChecklists = checklistTemplates.filter(t => 
    t.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRoutines = routineTemplates.filter(t => 
    t.routine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDocuments = documents.filter(d => 
    d.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group templates by category
  const groupedChecklists = filteredChecklists.reduce((acc, template) => {
    const category = template.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof checklistTemplates>);

  const groupedRoutines = filteredRoutines.reduce((acc, template) => {
    const category = template.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof routineTemplates>);

  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const category = doc.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const renderCategoryCard = (
    category: string,
    categoryConfig: { label: string; icon: any; color: string },
    items: any[],
    type: 'checklist' | 'routine' | 'document'
  ) => {
    const isExpanded = expandedCategories[`${type}-${category}`] ?? false;
    const Icon = categoryConfig.icon;
    
    return (
      <Collapsible
        key={category}
        open={isExpanded}
        onOpenChange={() => toggleCategory(`${type}-${category}`)}
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${categoryConfig.color} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{categoryConfig.label}</h3>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {items.length} {type === 'checklist' ? 'maler' : type === 'routine' ? 'rutiner' : 'dokumenter'} tilgjengelig
                  </p>
                </div>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t px-4 py-3 space-y-2 bg-muted/30">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-background border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {type === 'checklist' ? item.template_name : 
                       type === 'routine' ? item.routine_name : 
                       item.document_name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                    )}
                    {item.is_mandatory && (
                      <Badge variant="outline" className="mt-1 text-xs">{t("auto.obligatorisk")}</Badge>
                    )}
                  </div>
                  {type === 'document' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(item.file_path, item.document_name, item.id);
                      }}
                      disabled={downloadingId === item.id}
                    >
                      {downloadingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1" />
                          Last ned
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      {type === 'checklist' ? 'Bruk' : 'Vis'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Malbank
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xl font-bold">{checklistTemplates.length}</p>
                <p className="text-xs text-muted-foreground">{t("auto.sjekklister")}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xl font-bold">{routineTemplates.length}</p>
                <p className="text-xs text-muted-foreground">{t("auto.rutiner")}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xl font-bold">{documents.length}</p>
                <p className="text-xs text-muted-foreground">{t("auto.dokumenter")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t("auto.soek_etter_maler_rutiner_og_dokumenter")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="checklists" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checklists" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.sjekklister")}</span>
            </TabsTrigger>
            <TabsTrigger value="routines" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.rutiner")}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.dokumenter")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklists">
            {Object.keys(groupedChecklists).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("auto.ingen_sjekkliste_maler_tilgjengelig")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(groupedChecklists)
                  .sort(([a], [b]) => (CHECKLIST_CATEGORY_CONFIG[a]?.label || a).localeCompare(CHECKLIST_CATEGORY_CONFIG[b]?.label || b))
                  .map(([category, items]) => 
                    renderCategoryCard(
                      category,
                      CHECKLIST_CATEGORY_CONFIG[category] || { label: category, icon: FolderOpen, color: "bg-gray-500" },
                      items,
                      'checklist'
                    )
                  )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="routines">
            {Object.keys(groupedRoutines).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("auto.ingen_rutine_maler_tilgjengelig")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(groupedRoutines)
                  .sort(([a], [b]) => (ROUTINE_CATEGORY_CONFIG[a]?.label || a).localeCompare(ROUTINE_CATEGORY_CONFIG[b]?.label || b))
                  .map(([category, items]) => 
                    renderCategoryCard(
                      category,
                      ROUTINE_CATEGORY_CONFIG[category] || { label: category, icon: FolderOpen, color: "bg-gray-500" },
                      items,
                      'routine'
                    )
                  )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents">
            {Object.keys(groupedDocuments).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("auto.ingen_dokumenter_tilgjengelig")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(groupedDocuments)
                  .sort(([a], [b]) => (DOCUMENT_CATEGORY_CONFIG[a]?.label || a).localeCompare(DOCUMENT_CATEGORY_CONFIG[b]?.label || b))
                  .map(([category, items]) => 
                    renderCategoryCard(
                      category,
                      DOCUMENT_CATEGORY_CONFIG[category] || { label: category, icon: FolderOpen, color: "bg-gray-500" },
                      items,
                      'document'
                    )
                  )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
