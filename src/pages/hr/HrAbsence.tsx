import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, HeartPulse, Download } from "lucide-react";
import { useEmployeeAbsence } from "@/hooks/useEmployeeAbsence";
import { RegisterAbsenceDialog } from "@/components/absence/RegisterAbsenceDialog";
import { AbsenceList } from "@/components/absence/AbsenceList";
import { Skeleton } from "@/components/ui/skeleton";

export default function HrAbsence() {
  const { 
    absences, 
    isLoading, 
    createAbsence, 
    approveAbsence, 
    rejectAbsence,
    deleteAbsence,
    getYearStats,
    getPendingCount,
  } = useEmployeeAbsence();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const stats = getYearStats();
  const pendingCount = getPendingCount();
  
  // Filter absences by type
  const sykdomAbsences = absences.filter(a => 
    a.absence_type === "sykmelding" || a.absence_type === "egenmelding"
  );
  const egenmeldingAbsences = absences.filter(a => a.absence_type === "egenmelding");
  const permisjonAbsences = absences.filter(a => a.absence_type === "permisjon");
  const pendingAbsences = absences.filter(a => a.status === "pending");
  
  // Calculate absence percentage (simplified)
  const totalWorkDays = 250; // Approximate work days per year
  const absencePercentage = totalWorkDays > 0 
    ? ((stats.totalDaysThisYear / totalWorkDays) * 100).toFixed(1) 
    : "0";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fravær</h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over sykefravær, egenmeldinger og permisjoner
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Eksporter
            </Button>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Registrer fravær
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalDaysThisYear}</div>
            )}
            <div className="text-sm text-muted-foreground">Totalt fravær i år</div>
          </Card>
          <Card className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{absencePercentage}%</div>
            )}
            <div className="text-sm text-muted-foreground">Fraværsprosent</div>
          </Card>
          <Card className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.activeAbsences}</div>
            )}
            <div className="text-sm text-muted-foreground">Aktive sykemeldinger</div>
          </Card>
          <Card className="p-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{pendingCount}</div>
            )}
            <div className="text-sm text-muted-foreground">Ventende godkjenninger</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="pending">
              Til godkjenning {pendingCount > 0 && `(${pendingCount})`}
            </TabsTrigger>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="sykdom">Sykdom</TabsTrigger>
            <TabsTrigger value="egenmelding">Egenmelding</TabsTrigger>
            <TabsTrigger value="permisjon">Permisjon</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <Card className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ) : pendingAbsences.length === 0 ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <HeartPulse className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ingen ventende godkjenninger</h3>
                  <p className="text-muted-foreground">
                    Alle fraværsregistreringer er behandlet
                  </p>
                </div>
              </Card>
            ) : (
              <AbsenceList 
                absences={pendingAbsences}
                canApprove={true}
                canDelete={true}
                onApprove={approveAbsence}
                onReject={rejectAbsence}
                onDelete={deleteAbsence}
              />
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <Card className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ) : (
              <AbsenceList 
                absences={absences}
                canApprove={true}
                canDelete={true}
                onApprove={approveAbsence}
                onReject={rejectAbsence}
                onDelete={deleteAbsence}
              />
            )}
          </TabsContent>

          <TabsContent value="sykdom" className="mt-4">
            <AbsenceList 
              absences={sykdomAbsences}
              canApprove={true}
              onApprove={approveAbsence}
              onReject={rejectAbsence}
            />
          </TabsContent>

          <TabsContent value="egenmelding" className="mt-4">
            <AbsenceList 
              absences={egenmeldingAbsences}
              canApprove={true}
              onApprove={approveAbsence}
              onReject={rejectAbsence}
            />
          </TabsContent>

          <TabsContent value="permisjon" className="mt-4">
            <AbsenceList 
              absences={permisjonAbsences}
              canApprove={true}
              onApprove={approveAbsence}
              onReject={rejectAbsence}
            />
          </TabsContent>
        </Tabs>
      </div>

      <RegisterAbsenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={createAbsence}
      />
    </AppLayout>
  );
}
