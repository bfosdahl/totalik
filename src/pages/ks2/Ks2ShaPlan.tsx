import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKsRiggPlan } from "@/hooks/useKsRiggPlan";
import { MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCheck, 
  Upload, 
  Shield,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Building2,
  Users,
  FileWarning,
  Eye,
  Download
} from "lucide-react";
import { useKsModule2ShaPlan } from "@/hooks/useKsModule2ShaPlan";
import { Ks2ShaPlanCreate } from "@/components/ks2/sha/Ks2ShaPlanCreate";
import { Ks2ShaPlanUpload } from "@/components/ks2/sha/Ks2ShaPlanUpload";
import { Ks2ShaPlanView } from "@/components/ks2/sha/Ks2ShaPlanView";
import { Ks2ShaTilpasning } from "@/components/ks2/sha/Ks2ShaTilpasning";

export default function Ks2ShaPlan() {
  const { projectId } = useParams();
  const { shaPlan, tilpasning, isLoading, isSaving } = useKsModule2ShaPlan(projectId || "");
  const [activeTab, setActiveTab] = useState<string>("plan");
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [createType, setCreateType] = useState<"internal" | "external" | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!shaPlan) return null;
    
    switch (shaPlan.status) {
      case "draft":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Utkast</Badge>;
      case "pending_signatures":
        return <Badge className="bg-amber-500"><AlertCircle className="h-3 w-3 mr-1" />Venter på signatur</Badge>;
      case "signed":
        return <Badge className="bg-blue-500"><CheckCircle2 className="h-3 w-3 mr-1" />Signert</Badge>;
      case "approved":
        return <Badge className="bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" />Godkjent</Badge>;
      default:
        return null;
    }
  };

  // If no SHA plan exists, show the choice screen
  if (!shaPlan && !showCreateFlow) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <FileCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">SHA-plan</h2>
            <p className="text-muted-foreground">Plan for sikkerhet, helse og arbeidsmiljø</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  SHA-plan er lovpålagt for de fleste bygge- og anleggsprosjekter
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Planen skal utarbeides av byggherren og beskrive hvordan sikkerhet, helse og arbeidsmiljø skal ivaretas i prosjektet (Byggherreforskriften §8).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Choice Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Option 1: Create in system */}
          <Card className="cursor-pointer hover:border-emerald-500 transition-colors group" onClick={() => { setCreateType("internal"); setShowCreateFlow(true); }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <FileText className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Lag SHA-plan i systemet</CardTitle>
                  <Badge className="mt-1 bg-emerald-500">Anbefalt</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Vi henter automatisk all informasjon fra prosjektet:
              </CardDescription>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Prosjektinfo, byggherre, KP og KU
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Organisasjonskart fra underleverandører
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Risikoområder etter §8 bokstav c
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Digital signatur for alle parter
                </li>
              </ul>
              <Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600">
                Opprett SHA-plan
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Upload external */}
          <Card className="cursor-pointer hover:border-blue-500 transition-colors group" onClick={() => { setCreateType("external"); setShowCreateFlow(true); }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Upload className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Last opp ekstern SHA-plan</CardTitle>
                  <CardDescription>Byggherren har allerede laget planen</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Last opp SHA-plan mottatt fra byggherre:
              </CardDescription>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  Drag-and-drop PDF-fil
                </li>
                <li className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-blue-500" />
                  Kvitter for mottak og implementering
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Opprett vår tilpasning automatisk
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Koble til vårt HMS-system
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-4 border-blue-500 text-blue-500 hover:bg-blue-500/10">
                Last opp SHA-plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show create flow
  if (showCreateFlow && createType && !shaPlan) {
    if (createType === "internal") {
      return (
        <Ks2ShaPlanCreate 
          projectId={projectId || ""} 
          onCancel={() => { setShowCreateFlow(false); setCreateType(null); }} 
        />
      );
    } else {
      return (
        <Ks2ShaPlanUpload 
          projectId={projectId || ""} 
          onCancel={() => { setShowCreateFlow(false); setCreateType(null); }} 
        />
      );
    }
  }

  // SHA plan exists - show the plan with tabs
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <FileCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">SHA-plan</h2>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground">
              {shaPlan?.plan_type === "internal" ? "Opprettet i systemet" : "Lastet opp eksternt"} • Versjon {shaPlan?.version_number}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Forhåndsvis PDF
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Last ned
          </Button>
        </div>
      </div>

      {/* Status Widget */}
      <Card className="border-emerald-500/20">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">SHA-plan</p>
              <p className="font-semibold text-sm mt-1">
                {shaPlan?.status === "approved" ? "✓ Godkjent" : 
                 shaPlan?.status === "signed" ? "✓ Signert" : "Utkast"}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">KP oppnevnt</p>
              <p className="font-semibold text-sm mt-1">
                {shaPlan?.sha_coordinator_kp ? "✓ Ja" : "✗ Nei"}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">KU oppnevnt</p>
              <p className="font-semibold text-sm mt-1">
                {shaPlan?.sha_coordinator_ku ? "✓ Ja" : "✗ Nei"}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Vår tilpasning</p>
              <p className="font-semibold text-sm mt-1">
                {tilpasning?.status === "signed" ? "✓ Signert" : 
                 tilpasning ? "Utkast" : "Ikke opprettet"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plan">SHA-plan</TabsTrigger>
          <TabsTrigger value="tilpasning">Vår tilpasning</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="mt-4">
          <Ks2ShaPlanView projectId={projectId || ""} />
        </TabsContent>

        <TabsContent value="tilpasning" className="mt-4">
          <Ks2ShaTilpasning projectId={projectId || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
