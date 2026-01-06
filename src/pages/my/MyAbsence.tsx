import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, HeartPulse, FileText } from "lucide-react";
import { useEmployeeAbsence } from "@/hooks/useEmployeeAbsence";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterAbsenceDialog } from "@/components/absence/RegisterAbsenceDialog";
import { AbsenceList } from "@/components/absence/AbsenceList";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyAbsence() {
  const { profile } = useAuth();
  const { 
    isLoading, 
    createAbsence, 
    deleteAbsence, 
    getMyAbsences, 
    getYearStats 
  } = useEmployeeAbsence();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const myAbsences = getMyAbsences();
  const stats = getYearStats(profile?.id);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mitt fravær</h1>
            <p className="text-muted-foreground mt-1">
              Registrer og se oversikt over ditt fravær
            </p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Registrer fravær
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalDaysThisYear}</div>
            )}
            <div className="text-sm text-muted-foreground">Fraværsdager i år</div>
          </Card>
          <Card className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.egenmeldingsDaysUsed}</div>
            )}
            <div className="text-sm text-muted-foreground">Egenmeldingsdager brukt</div>
          </Card>
          <Card className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.activeAbsences}</div>
            )}
            <div className="text-sm text-muted-foreground">Aktive fraværsperioder</div>
          </Card>
        </div>

        {/* Info card */}
        <Card className="p-6 border-l-4 border-l-primary">
          <h3 className="font-semibold mb-2">Viktig informasjon om fravær</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Du har rett til 3 egenmeldingsdager uten legeerklæring</li>
            <li>• Ved sykdom over 3 dager må du legge ved legeerklæring</li>
            <li>• Fravær må registreres senest samme dag du er fraværende</li>
          </ul>
        </Card>

        {/* Absence list or empty state */}
        {isLoading ? (
          <Card className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ) : myAbsences.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <HeartPulse className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen fraværsregistreringer</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Du har ikke registrert noe fravær enda. Registrer fravær når du er syk eller har permisjon.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Registrer fravær
              </Button>
            </div>
          </Card>
        ) : (
          <AbsenceList 
            absences={myAbsences}
            showEmployee={false}
            canDelete={true}
            onDelete={deleteAbsence}
          />
        )}
      </div>

      <RegisterAbsenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={createAbsence}
        forSelf={true}
      />
    </AppLayout>
  );
}
