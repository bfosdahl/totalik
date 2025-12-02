import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download } from "lucide-react";

export default function HrContracts() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ansettelsesavtaler</h1>
            <p className="text-muted-foreground mt-1">
              Administrer arbeidsavtaler og ansettelsesdokumenter
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Ny avtale
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Totalt aktive</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Midlertidige</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Under prøvetid</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Utgår snart</div>
          </Card>
        </div>

        {/* Empty state */}
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen ansettelsesavtaler enda</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Start med å legge til en ny avtale for å holde oversikt over alle ansettelsesforhold
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Legg til første avtale
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}