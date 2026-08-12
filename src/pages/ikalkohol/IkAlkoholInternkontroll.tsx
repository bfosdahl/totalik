import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ClipboardList, 
  GraduationCap, 
  CalendarCheck, 
  Paperclip,
  Plus,
  Edit,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkAlkohol, AlkoholComplianceItem, AlkoholRiskControl, AlkoholTraining, AlkoholReview } from "@/hooks/useIkAlkohol";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { t } from "@/i18n/t";

const POINTS_COLORS: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-800 border-yellow-300",
  2: "bg-orange-100 text-orange-800 border-orange-300",
  4: "bg-red-100 text-red-800 border-red-300",
  8: "bg-red-200 text-red-900 border-red-400",
};

const TRAINING_TYPES = [
  { value: "ansvarlig_vertskap", label: t("auto.ansvarlig_vertskap") },
  { value: "alderskontroll", label: t("auto.alderskontroll") },
  { value: "konflikthandtering", label: t("auto.konflikthaandtering") },
  { value: "gjenkjenne_beruselse", label: t("auto.gjenkjenne_beruselse") },
  { value: "skjenkebestemmelser", label: t("auto.skjenkebestemmelser") },
  { value: "annet", label: t("auto.annet") },
];

const ROLES = [
  { value: "bartender", label: t("auto.bartender") },
  { value: "servitor", label: t("auto.servitoer") },
  { value: "vakt", label: t("auto.doervakt") },
  { value: "kasse", label: t("auto.kasse") },
  { value: "leder", label: t("auto.leder_styrer") },
];

export default function IkAlkoholInternkontroll() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { company, isLoading: authLoading, profile } = useAuth();
  const {
    licenses,
    complianceItems,
    riskControls,
    training,
    reviews,
    createLicense,
    updateLicense,
    upsertRiskControl,
    createTraining,
    updateTraining,
    deleteTraining,
    createReview,
    updateReview,
    initializeComplianceItems,
    complianceLoading,
  } = useIkAlkohol();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "kartlegging");
  const [editingControl, setEditingControl] = useState<Partial<AlkoholRiskControl> | null>(null);
  const [editingItem, setEditingItem] = useState<AlkoholComplianceItem | null>(null);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Partial<AlkoholTraining> | null>(null);
  const [editingReview, setEditingReview] = useState<Partial<AlkoholReview> | null>(null);
  const [licenseForm, setLicenseForm] = useState({
    municipality: "",
    license_number: "",
    valid_from: "",
    valid_to: "",
    concept_category: "",
    manager_name: "",
    manager_phone: "",
    manager_email: "",
    deputy_name: "",
    deputy_phone: "",
    deputy_email: "",
  });

  const isLoading = modulesLoading || authLoading;

  // Update tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Redirect if module not active
  useEffect(() => {
    if (!isLoading && !hasModule("IK_ALKOHOL")) {
      navigate("/");
    }
  }, [hasModule, isLoading, navigate]);

  // Initialize compliance items
  useEffect(() => {
    if (company?.id && complianceItems.length === 0 && !complianceLoading) {
      initializeComplianceItems.mutate();
    }
  }, [company?.id, complianceItems.length, complianceLoading]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const handleSaveControl = () => {
    if (!editingControl || !editingItem) return;
    
    upsertRiskControl.mutate({
      ...editingControl,
      compliance_item_id: editingItem.id,
    });
    setEditingControl(null);
    setEditingItem(null);
  };

  const handleSaveLicense = () => {
    createLicense.mutate({
      ...licenseForm,
      license_type: "Skjenkested",
    });
    setShowLicenseDialog(false);
    setLicenseForm({
      municipality: "",
      license_number: "",
      valid_from: "",
      valid_to: "",
      concept_category: "",
      manager_name: "",
      manager_phone: "",
      manager_email: "",
      deputy_name: "",
      deputy_phone: "",
      deputy_email: "",
    });
  };

  const handleSaveTraining = () => {
    if (!editingTraining) return;
    
    if (editingTraining.id) {
      updateTraining.mutate(editingTraining as AlkoholTraining);
    } else {
      createTraining.mutate(editingTraining as { employee_name: string; role: string; training_type: string });
    }
    setEditingTraining(null);
    setShowTrainingDialog(false);
  };

  const handleSaveReview = () => {
    if (!editingReview) return;
    
    if (editingReview.id) {
      updateReview.mutate(editingReview as AlkoholReview);
    } else {
      createReview.mutate(editingReview as { planned_date: string; review_type: string });
    }
    setEditingReview(null);
    setShowReviewDialog(false);
  };

  const getControlForItem = (itemId: string) => {
    return riskControls.find(r => r.compliance_item_id === itemId);
  };

  const getControlStatus = (itemId: string): "ok" | "mangler" | "under_arbeid" => {
    const control = getControlForItem(itemId);
    if (!control) return "mangler";
    if (control.status === "Aktiv" && control.preventive_measures) return "ok";
    return "under_arbeid";
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const activeLicense = licenses.find(l => l.is_active);

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("auto.internkontroll")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("auto.dokumenter_og_foelg_opp_internkontroll_e")}
            </p>
          </div>
          {!activeLicense && (
            <Button onClick={() => setShowLicenseDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrer bevilling
            </Button>
          )}
        </div>

        {/* License Info Card */}
        {activeLicense && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("auto.kommune")}</p>
                  <p className="font-medium">{activeLicense.municipality}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("auto.bevillingsnr")}</p>
                  <p className="font-medium">{activeLicense.license_number || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("auto.styrer")}</p>
                  <p className="font-medium">{activeLicense.manager_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("auto.gyldig_til_2")}</p>
                  <p className="font-medium">
                    {activeLicense.valid_to 
                      ? format(new Date(activeLicense.valid_to), "d. MMM yyyy", { locale: nb })
                      : "-"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="kartlegging" className="gap-2">
              <ClipboardList className="h-4 w-4 hidden sm:block" />
              <span className="hidden sm:inline">{t("auto.kartlegging")}</span>
              <span className="sm:hidden">{t("auto.regler")}</span>
            </TabsTrigger>
            <TabsTrigger value="opplaering" className="gap-2">
              <GraduationCap className="h-4 w-4 hidden sm:block" />
              <span className="hidden sm:inline">{t("auto.opplaering")}</span>
              <span className="sm:hidden">{t("auto.kurs")}</span>
            </TabsTrigger>
            <TabsTrigger value="oppfolging" className="gap-2">
              <CalendarCheck className="h-4 w-4 hidden sm:block" />
              <span className="hidden sm:inline">{t("auto.oppfoelging")}</span>
              <span className="sm:hidden">{t("auto.plan")}</span>
            </TabsTrigger>
            <TabsTrigger value="vedlegg" className="gap-2">
              <Paperclip className="h-4 w-4 hidden sm:block" />
              Vedlegg
            </TabsTrigger>
          </TabsList>

          {/* Kartlegging & Tiltak */}
          <TabsContent value="kartlegging" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Regelpunkter og tiltak
                </CardTitle>
                <CardDescription>
                  {t("auto.basert_paa_prikksystemet_klikk_paa_et_re")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">{t("auto.regel")}</TableHead>
                        <TableHead>{t("auto.overtredelse")}</TableHead>
                        <TableHead className="w-[80px] text-center">{t("auto.prikker")}</TableHead>
                        <TableHead className="w-[100px] text-center">{t("auto.status_2")}</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceItems.filter(c => c.is_active).map((item) => {
                        const status = getControlStatus(item.id);
                        const control = getControlForItem(item.id);
                        
                        return (
                          <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-mono text-xs">
                              {item.rule_reference}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{item.violation_description}</p>
                              {item.recommended_focus && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Fokus: {item.recommended_focus}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={POINTS_COLORS[item.points] || ""}>
                                {item.points}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {status === "ok" && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  OK
                                </Badge>
                              )}
                              {status === "mangler" && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Mangler
                                </Badge>
                              )}
                              {status === "under_arbeid" && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {t("auto.under_arbeid")}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingItem(item);
                                  setEditingControl(control || {
                                    challenges: "",
                                    preventive_measures: "",
                                    responsible_role: "",
                                    deadline_period: "",
                                    status: "Utkast",
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opplæring */}
          <TabsContent value="opplaering" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Opplæringsplan
                  </CardTitle>
                  <CardDescription>
                    {t("auto.dokumenter_opplaering_for_alle_ansatte")}
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingTraining({
                    employee_name: "",
                    role: "",
                    training_type: "",
                    is_completed: false,
                  });
                  setShowTrainingDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til
                </Button>
              </CardHeader>
              <CardContent>
                {training.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t("auto.ingen_opplaering_registrert_ennaa")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("auto.ansatt")}</TableHead>
                          <TableHead>{t("auto.rolle")}</TableHead>
                          <TableHead>{t("auto.type")}</TableHead>
                          <TableHead>{t("auto.gjennomfoert")}</TableHead>
                          <TableHead>{t("auto.utloeper")}</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {training.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.employee_name}</TableCell>
                            <TableCell>
                              {ROLES.find(r => r.value === t.role)?.label || t.role}
                            </TableCell>
                            <TableCell>
                              {TRAINING_TYPES.find(tt => tt.value === t.training_type)?.label || t.training_type}
                            </TableCell>
                            <TableCell>
                              {t.completed_date 
                                ? format(new Date(t.completed_date), "d. MMM yyyy", { locale: nb })
                                : "-"
                              }
                            </TableCell>
                            <TableCell>
                              {t.expires_date 
                                ? format(new Date(t.expires_date), "d. MMM yyyy", { locale: nb })
                                : "-"
                              }
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingTraining(t);
                                  setShowTrainingDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Oppfølging */}
          <TabsContent value="oppfolging" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5" />
                    Revisjonsplan
                  </CardTitle>
                  <CardDescription>
                    {t("auto.plan_for_jevnlig_gjennomgang_av_internko")}
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingReview({
                    review_type: "monthly",
                    planned_date: format(new Date(), "yyyy-MM-dd"),
                    status: "Planlagt",
                    agenda_points: [],
                    tasks: [],
                  });
                  setShowReviewDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Planlegg revisjon
                </Button>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t("auto.ingen_revisjoner_planlagt_ennaa")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div 
                        key={review.id} 
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div>
                          <p className="font-medium capitalize">{review.review_type} revisjon</p>
                          <p className="text-sm text-muted-foreground">
                            Planlagt: {format(new Date(review.planned_date), "d. MMMM yyyy", { locale: nb })}
                          </p>
                          {review.completed_date && (
                            <p className="text-sm text-emerald-600">
                              Gjennomført: {format(new Date(review.completed_date), "d. MMM yyyy", { locale: nb })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={review.status === "Gjennomført" ? "default" : "outline"}>
                            {review.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingReview(review);
                              setShowReviewDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vedlegg */}
          <TabsContent value="vedlegg" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Vedlegg og dokumentasjon
                </CardTitle>
                <CardDescription>
                  {t("auto.last_opp_ansattlister_organisasjonskart_")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  {t("auto.vedleggsfunksjonalitet_kommer_snart")}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Control Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => { setEditingItem(null); setEditingControl(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("auto.registrer_tiltak")}</DialogTitle>
          </DialogHeader>
          {editingItem && editingControl && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{editingItem.rule_reference}</p>
                <p className="text-sm text-muted-foreground">{editingItem.violation_description}</p>
                <Badge className={`mt-2 ${POINTS_COLORS[editingItem.points]}`}>
                  {editingItem.points} prikker
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>{t("auto.utfordringer")}</Label>
                <Textarea
                  placeholder={t("auto.beskriv_utfordringer_knyttet_til_dette_r")}
                  value={editingControl.challenges || ""}
                  onChange={(e) => setEditingControl({ ...editingControl, challenges: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("auto.forebyggende_tiltak_og_rutiner")}</Label>
                <Textarea
                  placeholder={t("auto.beskriv_tiltak_for_aa_forhindre_brudd")}
                  value={editingControl.preventive_measures || ""}
                  onChange={(e) => setEditingControl({ ...editingControl, preventive_measures: e.target.value })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("auto.ansvarlig_rolle_person")}</Label>
                  <Input
                    placeholder={t("auto.f_eks_styrer_doervakt")}
                    value={editingControl.responsible_role || ""}
                    onChange={(e) => setEditingControl({ ...editingControl, responsible_role: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.frister_perioder")}</Label>
                  <Input
                    placeholder={t("auto.f_eks_daglig_ved_hver_vakt")}
                    value={editingControl.deadline_period || ""}
                    onChange={(e) => setEditingControl({ ...editingControl, deadline_period: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("auto.status_2")}</Label>
                <Select
                  value={editingControl.status || "Utkast"}
                  onValueChange={(value) => setEditingControl({ ...editingControl, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Utkast">{t("auto.utkast")}</SelectItem>
                    <SelectItem value="Aktiv">{t("auto.aktiv")}</SelectItem>
                    <SelectItem value="Under revisjon">{t("auto.under_revisjon")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingItem(null); setEditingControl(null); }}>
              {t("auto.avbryt")}
            </Button>
            <Button onClick={handleSaveControl} disabled={upsertRiskControl.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Dialog */}
      <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("auto.registrer_bevilling")}</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("auto.kommune_2")}</Label>
              <Input
                value={licenseForm.municipality}
                onChange={(e) => setLicenseForm({ ...licenseForm, municipality: e.target.value })}
                placeholder={t("auto.f_eks_oslo")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auto.bevillingsnummer")}</Label>
              <Input
                value={licenseForm.license_number}
                onChange={(e) => setLicenseForm({ ...licenseForm, license_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auto.gyldig_fra")}</Label>
              <Input
                type="date"
                value={licenseForm.valid_from}
                onChange={(e) => setLicenseForm({ ...licenseForm, valid_from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auto.gyldig_til_2")}</Label>
              <Input
                type="date"
                value={licenseForm.valid_to}
                onChange={(e) => setLicenseForm({ ...licenseForm, valid_to: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("auto.konseptkategori")}</Label>
              <Select
                value={licenseForm.concept_category}
                onValueChange={(value) => setLicenseForm({ ...licenseForm, concept_category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("auto.velg_kategori")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant_cafe">{t("auto.restaurant_kaf")}</SelectItem>
                  <SelectItem value="pub_bar">{t("auto.pub_bar")}</SelectItem>
                  <SelectItem value="nightclub">{t("auto.nattklubb")}</SelectItem>
                  <SelectItem value="hotel">{t("auto.hotell")}</SelectItem>
                  <SelectItem value="event">{t("auto.arrangement")}</SelectItem>
                  <SelectItem value="venue">{t("auto.selskapslokale")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-medium">{t("auto.styrer")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("auto.navn_2")}</Label>
              <Input
                value={licenseForm.manager_name}
                onChange={(e) => setLicenseForm({ ...licenseForm, manager_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auto.telefon")}</Label>
              <Input
                value={licenseForm.manager_phone}
                onChange={(e) => setLicenseForm({ ...licenseForm, manager_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("auto.e_post_2")}</Label>
              <Input
                type="email"
                value={licenseForm.manager_email}
                onChange={(e) => setLicenseForm({ ...licenseForm, manager_email: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-medium">{t("auto.stedfortreder")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("auto.navn_2")}</Label>
              <Input
                value={licenseForm.deputy_name}
                onChange={(e) => setLicenseForm({ ...licenseForm, deputy_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auto.telefon")}</Label>
              <Input
                value={licenseForm.deputy_phone}
                onChange={(e) => setLicenseForm({ ...licenseForm, deputy_phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLicenseDialog(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button 
              onClick={handleSaveLicense} 
              disabled={!licenseForm.municipality || createLicense.isPending}
            >
              Lagre bevilling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Training Dialog */}
      <Dialog open={showTrainingDialog} onOpenChange={setShowTrainingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTraining?.id ? "Rediger opplæring" : "Legg til opplæring"}
            </DialogTitle>
          </DialogHeader>
          {editingTraining && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("auto.ansatt_2")}</Label>
                <Input
                  value={editingTraining.employee_name || ""}
                  onChange={(e) => setEditingTraining({ ...editingTraining, employee_name: e.target.value })}
                  placeholder={t("auto.navn_paa_ansatt")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("auto.rolle_2")}</Label>
                <Select
                  value={editingTraining.role || ""}
                  onValueChange={(value) => setEditingTraining({ ...editingTraining, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_rolle")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("auto.type_opplaering")}</Label>
                <Select
                  value={editingTraining.training_type || ""}
                  onValueChange={(value) => setEditingTraining({ ...editingTraining, training_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("auto.gjennomfoert_dato")}</Label>
                  <Input
                    type="date"
                    value={editingTraining.completed_date || ""}
                    onChange={(e) => setEditingTraining({ 
                      ...editingTraining, 
                      completed_date: e.target.value,
                      is_completed: !!e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.utloepsdato")}</Label>
                  <Input
                    type="date"
                    value={editingTraining.expires_date || ""}
                    onChange={(e) => setEditingTraining({ ...editingTraining, expires_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("auto.notater")}</Label>
                <Textarea
                  value={editingTraining.notes || ""}
                  onChange={(e) => setEditingTraining({ ...editingTraining, notes: e.target.value })}
                  placeholder={t("auto.eventuelle_notater")}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrainingDialog(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button 
              onClick={handleSaveTraining} 
              disabled={!editingTraining?.employee_name || !editingTraining?.role || !editingTraining?.training_type}
            >
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReview?.id ? "Rediger revisjon" : "Planlegg revisjon"}
            </DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("auto.type_revisjon")}</Label>
                <Select
                  value={editingReview.review_type || "monthly"}
                  onValueChange={(value) => setEditingReview({ ...editingReview, review_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t("auto.maanedlig")}</SelectItem>
                    <SelectItem value="quarterly">{t("auto.kvartalsvis")}</SelectItem>
                    <SelectItem value="annual">{t("auto.aarlig")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("auto.planlagt_dato_2")}</Label>
                <Input
                  type="date"
                  value={editingReview.planned_date || ""}
                  onChange={(e) => setEditingReview({ ...editingReview, planned_date: e.target.value })}
                />
              </div>
              {editingReview.id && (
                <>
                  <div className="space-y-2">
                    <Label>{t("auto.gjennomfoert_dato")}</Label>
                    <Input
                      type="date"
                      value={editingReview.completed_date || ""}
                      onChange={(e) => setEditingReview({ 
                        ...editingReview, 
                        completed_date: e.target.value,
                        status: e.target.value ? "Gjennomført" : "Planlagt"
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.deltakere")}</Label>
                    <Input
                      value={editingReview.participants || ""}
                      onChange={(e) => setEditingReview({ ...editingReview, participants: e.target.value })}
                      placeholder={t("auto.navn_paa_deltakere")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.oppsummering")}</Label>
                    <Textarea
                      value={editingReview.summary || ""}
                      onChange={(e) => setEditingReview({ ...editingReview, summary: e.target.value })}
                      placeholder={t("auto.oppsummering_av_revisjonen")}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button 
              onClick={handleSaveReview} 
              disabled={!editingReview?.planned_date}
            >
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
