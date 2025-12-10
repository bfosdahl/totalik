import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleProjectSubcontractorsProps {
  projectId: string;
}

export function SimpleProjectSubcontractors({ projectId }: SimpleProjectSubcontractorsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Underleverandører
        </CardTitle>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Legg til
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Underleverandører kommer snart</p>
          <p className="text-sm text-muted-foreground">Legg til underleverandører som jobber på prosjektet</p>
        </div>
      </CardContent>
    </Card>
  );
}
