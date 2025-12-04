import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Plus, 
  Download, 
  Eye, 
  Shield,
  Calendar,
  User,
  Building2
} from "lucide-react";

export default function Ks2ShaPlan() {
  const { projectId } = useParams();
  const [shaPlans] = useState([
    {
      id: "1",
      title: "SHA-plan for byggefase",
      version: "1.0",
      status: "active",
      createdAt: "2024-11-15",
      signedBy: "Ola Nordmann",
      signedAt: "2024-11-16",
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <FileCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">SHA-plan</h2>
            <p className="text-muted-foreground">Plan for sikkerhet, helse og arbeidsmiljø</p>
          </div>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="h-4 w-4 mr-2" />
          Opprett SHA-plan
        </Button>
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
                Planen skal utarbeides av byggherren og beskrive hvordan sikkerhet, helse og arbeidsmiljø skal ivaretas i prosjektet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SHA Plans List */}
      {shaPlans.length > 0 ? (
        <div className="space-y-4">
          {shaPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <CardDescription>Versjon {plan.version}</CardDescription>
                  </div>
                  <Badge className="bg-emerald-500">
                    {plan.status === "active" ? "Aktiv" : "Utkast"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Opprettet: {plan.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Signert av: {plan.signedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Signert: {plan.signedAt}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Vis
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Last ned PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen SHA-plan opprettet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Opprett en SHA-plan for dette prosjektet
            </p>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" />
              Opprett SHA-plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
