import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleProjectChecklistsProps {
  projectId: string;
}

export function SimpleProjectChecklists({ projectId }: SimpleProjectChecklistsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Sjekklister / Egenkontroll
        </CardTitle>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Ny sjekkliste
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckSquare className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sjekklister kommer snart</p>
          <p className="text-sm text-muted-foreground">Opprett egenkontroll-sjekklister for prosjektet</p>
        </div>
      </CardContent>
    </Card>
  );
}
