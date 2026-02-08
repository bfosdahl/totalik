import { useState } from "react";
import { ClipboardCheck, Plus, Calendar, AlertTriangle, CheckCircle, Clock, MoreHorizontal, Pencil, Trash2, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { useFdvControls } from "@/hooks/useFdvControls";
import { useFdvBuildings } from "@/hooks/useFdvBuildings";
import { FdvControlDialog } from "@/components/fdv/FdvControlDialog";
import { FdvCompleteControlDialog } from "@/components/fdv/FdvCompleteControlDialog";
import { FdvControl, FDV_CONTROL_TYPE_LABELS } from "@/types/fdv";
import { format, differenceInDays, isBefore, startOfDay } from "date-fns";
import { nb } from "date-fns/locale";

export default function FdvControls() {
  const { controls, overdueControls, isLoading, createControl, updateControl, completeControl, deleteControl } = useFdvControls();
  const { buildings } = useFdvBuildings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<FdvControl | null>(null);
  const [completingControl, setCompletingControl] = useState<FdvControl | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [controlToDelete, setControlToDelete] = useState<FdvControl | null>(null);

  const handleCreate = () => {
    setEditingControl(null);
    setDialogOpen(true);
  };

  const handleEdit = (control: FdvControl) => {
    setEditingControl(control);
    setDialogOpen(true);
  };

  const handleComplete = (control: FdvControl) => {
    setCompletingControl(control);
    setCompleteDialogOpen(true);
  };

  const handleDelete = (control: FdvControl) => {
    setControlToDelete(control);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (controlToDelete) {
      await deleteControl(controlToDelete.id);
      setDeleteDialogOpen(false);
      setControlToDelete(null);
    }
  };

  const handleSave = async (data: Partial<FdvControl>) => {
    if (editingControl) {
      await updateControl(editingControl.id, data);
    } else {
      await createControl(data as Omit<FdvControl, 'id' | 'created_at' | 'updated_at'>);
    }
    setDialogOpen(false);
  };

  const handleCompleteControl = async (status: 'ok' | 'avvik' | 'delvis_ok', findings?: string, notes?: string) => {
    if (completingControl) {
      await completeControl(completingControl, { status, findings, notes });
      setCompleteDialogOpen(false);
      setCompletingControl(null);
    }
  };

  const today = startOfDay(new Date());
  
  const getStatusBadge = (control: FdvControl) => {
    if (!control.next_due_date) return <Badge variant="outline">Ikke planlagt</Badge>;
    
    const dueDate = new Date(control.next_due_date);
    const daysUntil = differenceInDays(dueDate, today);
    
    if (control.status === 'avvik') {
      return <Badge variant="destructive">Avvik</Badge>;
    }
    if (isBefore(dueDate, today)) {
      return <Badge variant="destructive">Forfalt</Badge>;
    }
    if (daysUntil <= 14) {
      return <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">Snart</Badge>;
    }
    if (control.status === 'utfort') {
      return <Badge variant="default" className="bg-green-500">Utført</Badge>;
    }
    return <Badge variant="outline">Planlagt</Badge>;
  };

  const getBuildingName = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || 'Ukjent bygg';
  };

  const ControlCard = ({ control }: { control: FdvControl }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{control.name}</h3>
              {getStatusBadge(control)}
            </div>
            <p className="text-sm text-muted-foreground">{FDV_CONTROL_TYPE_LABELS[control.control_type]}</p>
            <p className="text-sm text-muted-foreground">{getBuildingName(control.building_id)}</p>
            
            <div className="flex items-center gap-4 mt-2 text-sm">
              {control.next_due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(control.next_due_date), 'd. MMM yyyy', { locale: nb })}
                </span>
              )}
              {control.responsible_name && (
                <span className="text-muted-foreground">{control.responsible_name}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleComplete(control)}>
              <Play className="h-4 w-4 mr-1" />
              Utfør
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(control)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(control)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slett
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-primary" />
              Kontroller og vedlikehold
            </h1>
            <p className="text-muted-foreground mt-1">
              Administrer lovpålagte og anbefalte kontroller
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Ny kontroll
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{controls.length}</p>
                  <p className="text-sm text-muted-foreground">Totalt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overdueControls.length}</p>
                  <p className="text-sm text-muted-foreground">Forfalt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {controls.filter(c => {
                      if (!c.next_due_date) return false;
                      const days = differenceInDays(new Date(c.next_due_date), today);
                      return days > 0 && days <= 30;
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Neste 30 dager</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {controls.filter(c => c.status === 'utfort').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Utført</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Alle ({controls.length})</TabsTrigger>
            <TabsTrigger value="overdue" className="text-destructive">
              Forfalt ({overdueControls.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">Kommende</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Laster kontroller...</div>
            ) : controls.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen kontroller registrert</h3>
                  <p className="text-muted-foreground mb-4">Legg til kontroller for dine bygg</p>
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ny kontroll
                  </Button>
                </CardContent>
              </Card>
            ) : (
              controls.map((control) => <ControlCard key={control.id} control={control} />)
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4 mt-4">
            {overdueControls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Ingen forfalt kontroller</div>
            ) : (
              overdueControls.map((control) => <ControlCard key={control.id} control={control} />)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {controls.filter(c => c.next_due_date && !isBefore(new Date(c.next_due_date), today)).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Ingen kommende kontroller</div>
            ) : (
              controls
                .filter(c => c.next_due_date && !isBefore(new Date(c.next_due_date), today))
                .map((control) => <ControlCard key={control.id} control={control} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <FdvControlDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        control={editingControl}
        buildings={buildings}
        onSave={handleSave}
      />

      <FdvCompleteControlDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        control={completingControl}
        onComplete={handleCompleteControl}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett kontroll</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{controlToDelete?.name}"?
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
