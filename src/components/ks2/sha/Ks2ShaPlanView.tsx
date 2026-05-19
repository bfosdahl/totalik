import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Building2,
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Eye,
  Download,
  MapPin,
} from "lucide-react";
import { useKsModule2ShaPlan, RiskArea } from "@/hooks/useKsModule2ShaPlan";
import { useKsRiggPlan } from "@/hooks/useKsRiggPlan";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  projectId: string;
}

export function Ks2ShaPlanView({ projectId }: Props) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { shaPlan, updateShaPlan, approveAsEntrepreneur, getExternalFileUrl, isLoading, isSaving } = useKsModule2ShaPlan(projectId);
  const { plans: riggPlans } = useKsRiggPlan(projectId);
  const [editedRiskAreas, setEditedRiskAreas] = useState<RiskArea[] | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);
  const [highlightParagraph, setHighlightParagraph] = useState<string | null>(null);
  const riskRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Build paragraph -> [{planId, planName, objectId, label, color, note}]
  const linksByParagraph = useMemo(() => {
    const map: Record<string, Array<{ planId: string; planName: string; objectId: string; label: string; color: string; note?: string }>> = {};
    riggPlans.forEach((plan) => {
      (plan.canvas_data?.objects || []).forEach((obj) => {
        (obj.linkedRiskParagraphs || []).forEach((p) => {
          if (!map[p]) map[p] = [];
          map[p].push({ planId: plan.id, planName: plan.name, objectId: obj.id, label: obj.label, color: obj.color, note: obj.riskNote });
        });
      });
    });
    return map;
  }, [riggPlans]);

  // Handle ?paragraph=X deep link from riggplan
  useEffect(() => {
    const p = searchParams.get("paragraph");
    if (p) {
      setAccordionValue("risks");
      setHighlightParagraph(p);
      searchParams.delete("paragraph");
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => {
        riskRefs.current[p]?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setHighlightParagraph(null), 2500);
      }, 250);
    }
  }, [searchParams, setSearchParams]);


  // Get current user's full name for approval
  const currentUserName = profile 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Ukjent bruker'
    : 'Ukjent bruker';

  if (isLoading || !shaPlan) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const riskAreas = editedRiskAreas || shaPlan.risk_areas || [];

  const handleRiskAreaChange = (index: number, field: "checked" | "measures", value: boolean | string) => {
    const updated = riskAreas.map((ra, i) => 
      i === index ? { ...ra, [field]: value } : ra
    );
    setEditedRiskAreas(updated);
  };

  const handleSaveRiskAreas = async () => {
    if (!editedRiskAreas) return;
    await updateShaPlan({ risk_areas: editedRiskAreas } as any);
    setEditedRiskAreas(null);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    await approveAsEntrepreneur(currentUserName);
    setIsApproving(false);
  };

  const handleViewExternal = async () => {
    const url = await getExternalFileUrl();
    if (url) {
      window.open(url, "_blank");
    }
  };

  // External plan view
  if (shaPlan.plan_type === "external") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ekstern SHA-plan
            </CardTitle>
            <CardDescription>
              Lastet opp {shaPlan.uploaded_at ? new Date(shaPlan.uploaded_at).toLocaleDateString("nb-NO") : ""} av {shaPlan.uploaded_by_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">{shaPlan.external_file_name}</p>
                <p className="text-sm text-muted-foreground">PDF-dokument</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleViewExternal}>
                  <Eye className="h-4 w-4 mr-2" />
                  Vis
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Last ned
                </Button>
              </div>
            </div>

            {!shaPlan.entrepreneur_approved && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-700 dark:text-amber-400">
                        Bekreft mottak og implementering
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bekreft at SHA-planen er mottatt og implementert i deres HMS-system.
                      </p>
                      <Button 
                        className="mt-3 bg-amber-500 hover:bg-amber-600"
                        onClick={handleApprove}
                        disabled={isApproving}
                      >
                        {isApproving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Godkjent og implementert i vårt HMS-system
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {shaPlan.entrepreneur_approved && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">
                        SHA-plan godkjent og implementert
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Godkjent av {shaPlan.entrepreneur_approved_by} den {shaPlan.entrepreneur_approved_at ? new Date(shaPlan.entrepreneur_approved_at).toLocaleDateString("nb-NO") : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Internal plan view
  return (
    <div className="space-y-6">
      <Accordion
        type="multiple"
        value={accordionValue ? Array.from(new Set(["info", "risks", accordionValue])) : ["info", "risks"]}
        onValueChange={(v) => setAccordionValue(v[v.length - 1])}
        className="space-y-4"
      >
        {/* Project Info */}
        <AccordionItem value="info" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold">Prosjektinformasjon</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 sm:grid-cols-2 pt-4">
              <div>
                <Label className="text-muted-foreground">Prosjekt</Label>
                <p className="font-medium">{shaPlan.project_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Adresse</Label>
                <p className="font-medium">{shaPlan.project_address || "Ikke angitt"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Byggherre</Label>
                <p className="font-medium">{shaPlan.client_name || "Ikke angitt"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Org.nr</Label>
                <p className="font-medium">{shaPlan.client_org_number || "Ikke angitt"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Koordinator prosjektering (KP)</Label>
                <p className="font-medium">{shaPlan.sha_coordinator_kp || "Ikke oppnevnt"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Koordinator utførelse (KU)</Label>
                <p className="font-medium">{shaPlan.sha_coordinator_ku || "Ikke oppnevnt"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Planlagt oppstart</Label>
                <p className="font-medium">
                  {shaPlan.planned_start_date ? new Date(shaPlan.planned_start_date).toLocaleDateString("nb-NO") : "Ikke angitt"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Planlagt ferdigstillelse</Label>
                <p className="font-medium">
                  {shaPlan.planned_end_date ? new Date(shaPlan.planned_end_date).toLocaleDateString("nb-NO") : "Ikke angitt"}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Risk Areas */}
        <AccordionItem value="risks" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="font-semibold">Risikoområder (§8 bokstav c)</span>
              <Badge variant="secondary" className="ml-2">
                {riskAreas.filter(ra => ra.checked).length} av {riskAreas.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-4">
              {riskAreas.map((ra, index) => (
                <div key={ra.id} className={`border rounded-lg p-3 ${ra.checked ? "border-amber-500/30 bg-amber-500/5" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id={`view-${ra.id}`}
                      checked={ra.checked}
                      onCheckedChange={(checked) => handleRiskAreaChange(index, "checked", !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`view-${ra.id}`} className="cursor-pointer text-sm">
                        <Badge variant="outline" className="mr-2 text-xs">{ra.paragraph}</Badge>
                        {ra.description}
                      </Label>
                      {ra.checked && (
                        <Textarea 
                          className="mt-2"
                          placeholder="Tiltak..."
                          value={ra.measures}
                          onChange={(e) => handleRiskAreaChange(index, "measures", e.target.value)}
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {editedRiskAreas && (
                <Button onClick={handleSaveRiskAreas} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Lagre endringer
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Change Routine */}
        <AccordionItem value="routine" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Endringsrutine</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {shaPlan.change_routine_text || "Ingen endringsrutine definert."}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Signatures */}
        <AccordionItem value="signatures" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">Signaturer</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 sm:grid-cols-3 pt-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">Byggherre</p>
                  {shaPlan.client_signature ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 mx-auto mt-2 text-emerald-500" />
                      <p className="text-sm mt-2">{shaPlan.client_signed_by}</p>
                      <p className="text-xs text-muted-foreground">
                        {shaPlan.client_signed_at ? new Date(shaPlan.client_signed_at).toLocaleDateString("nb-NO") : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <Clock className="h-8 w-8 mx-auto mt-2 text-muted-foreground" />
                      <p className="text-sm mt-2 text-muted-foreground">Ikke signert</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Send til signering
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">KP</p>
                  {shaPlan.kp_signature ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 mx-auto mt-2 text-emerald-500" />
                      <p className="text-sm mt-2">{shaPlan.kp_signed_by}</p>
                      <p className="text-xs text-muted-foreground">
                        {shaPlan.kp_signed_at ? new Date(shaPlan.kp_signed_at).toLocaleDateString("nb-NO") : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <Clock className="h-8 w-8 mx-auto mt-2 text-muted-foreground" />
                      <p className="text-sm mt-2 text-muted-foreground">Ikke signert</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Send til signering
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">KU</p>
                  {shaPlan.ku_signature ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 mx-auto mt-2 text-emerald-500" />
                      <p className="text-sm mt-2">{shaPlan.ku_signed_by}</p>
                      <p className="text-xs text-muted-foreground">
                        {shaPlan.ku_signed_at ? new Date(shaPlan.ku_signed_at).toLocaleDateString("nb-NO") : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <Clock className="h-8 w-8 mx-auto mt-2 text-muted-foreground" />
                      <p className="text-sm mt-2 text-muted-foreground">Ikke signert</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Send til signering
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
