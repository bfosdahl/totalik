import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Calendar, Trash2, Edit, ChevronRight, Target, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Milestones, Milestone } from "@/hooks/useKsModule2Milestones";
import { format, differenceInDays, isWithinInterval, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameMonth } from "date-fns";
import { nb } from "date-fns/locale";

const STATUS_OPTIONS = [
  { value: "not_started", label: "Ikke startet", color: "bg-muted text-muted-foreground" },
  { value: "in_progress", label: "Pågår", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "completed", label: "Fullført", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "delayed", label: "Forsinket", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const COLOR_OPTIONS = [
  { value: "#3B82F6", label: "Blå" },
  { value: "#22C55E", label: "Grønn" },
  { value: "#EAB308", label: "Gul" },
  { value: "#EF4444", label: "Rød" },
  { value: "#8B5CF6", label: "Lilla" },
  { value: "#F97316", label: "Oransje" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#EC4899", label: "Rosa" },
];

export default function Ks2Fremdriftsplan() {
  const { projectId } = useParams<{ projectId: string }>();
  const { company } = useAuth();
  const { milestones, isLoading, createMilestone, updateMilestone, deleteMilestone } = useKsModule2Milestones(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    status: "not_started",
    progress: 0,
    responsible_name: "",
    color: "#3B82F6",
  });

  // Calculate date range for Gantt chart
  const dateRange = useMemo(() => {
    if (milestones.length === 0) {
      const now = new Date();
      return {
        start: startOfMonth(now),
        end: endOfMonth(addMonths(now, 2)),
      };
    }

    const dates = milestones.flatMap(m => [parseISO(m.start_date), parseISO(m.end_date)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      start: startOfMonth(minDate),
      end: endOfMonth(maxDate),
    };
  }, [milestones]);

  // Generate months for header
  const months = useMemo(() => {
    const result: Date[] = [];
    let current = dateRange.start;
    while (current <= dateRange.end) {
      result.push(current);
      current = addMonths(current, 1);
    }
    return result;
  }, [dateRange]);

  // Calculate total days
  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;

  // Stats
  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter(m => m.status === "completed").length;
    const inProgress = milestones.filter(m => m.status === "in_progress").length;
    const delayed = milestones.filter(m => m.status === "delayed").length;
    const avgProgress = total > 0 ? Math.round(milestones.reduce((acc, m) => acc + (m.progress || 0), 0) / total) : 0;
    
    return { total, completed, inProgress, delayed, avgProgress };
  }, [milestones]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(), "yyyy-MM-dd"),
      status: "not_started",
      progress: 0,
      responsible_name: "",
      color: "#3B82F6",
    });
    setEditingMilestone(null);
  };

  const handleOpenDialog = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        title: milestone.title,
        description: milestone.description || "",
        start_date: milestone.start_date,
        end_date: milestone.end_date,
        status: milestone.status,
        progress: milestone.progress || 0,
        responsible_name: milestone.responsible_name || "",
        color: milestone.color || "#3B82F6",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!projectId || !company?.id) return;

    if (editingMilestone) {
      await updateMilestone.mutateAsync({
        id: editingMilestone.id,
        ...formData,
      });
    } else {
      await createMilestone.mutateAsync({
        project_id: projectId,
        company_id: company.id,
        title: formData.title,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        progress: formData.progress,
        responsible_name: formData.responsible_name || null,
        responsible_id: null,
        color: formData.color,
        sort_order: milestones.length,
        parent_id: null,
      });
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMilestone.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : null;
  };

  const calculateBarPosition = (milestone: Milestone) => {
    const start = parseISO(milestone.start_date);
    const end = parseISO(milestone.end_date);
    
    const startOffset = differenceInDays(start, dateRange.start);
    const duration = differenceInDays(end, start) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fremdriftsplan</h1>
          <p className="text-muted-foreground">Planlegg og følg opp prosjektmilepæler</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Ny milepæl
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMilestone ? "Rediger milepæl" : "Ny milepæl"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tittel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="F.eks. Grunnarbeid ferdig"
                />
              </div>
              <div>
                <Label>Beskrivelse</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaljer om milepælen..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Startdato *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Sluttdato *</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fremdrift (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Ansvarlig</Label>
                <Input
                  value={formData.responsible_name}
                  onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                  placeholder="Navn på ansvarlig person"
                />
              </div>
              <div>
                <Label>Farge</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.value ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.start_date || !formData.end_date || createMilestone.isPending || updateMilestone.isPending}
                >
                  {editingMilestone ? "Lagre" : "Opprett"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Milepæler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Fullført</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Pågår</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
                <p className="text-xs text-muted-foreground">Snitt fremdrift</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      {milestones.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tidslinje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Month headers */}
                <div className="flex border-b mb-2">
                  <div className="w-48 shrink-0 px-2 py-1 font-medium text-sm">
                    Milepæl
                  </div>
                  <div className="flex-1 flex">
                    {months.map((month, i) => {
                      const daysInMonth = differenceInDays(endOfMonth(month), startOfMonth(month)) + 1;
                      const width = (daysInMonth / totalDays) * 100;
                      return (
                        <div
                          key={i}
                          className="text-center text-sm font-medium py-1 border-l first:border-l-0"
                          style={{ width: `${width}%` }}
                        >
                          {format(month, "MMM yyyy", { locale: nb })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Milestone rows */}
                <div className="space-y-2">
                  {milestones.map((milestone) => {
                    const barPos = calculateBarPosition(milestone);
                    return (
                      <div key={milestone.id} className="flex items-center group">
                        <div className="w-48 shrink-0 px-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDialog(milestone)}
                              className="text-sm font-medium truncate hover:text-primary transition-colors text-left"
                            >
                              {milestone.title}
                            </button>
                            <button
                              onClick={() => setDeleteId(milestone.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {milestone.responsible_name || "Ingen ansvarlig"}
                          </p>
                        </div>
                        <div className="flex-1 relative h-10">
                          {/* Background grid */}
                          <div className="absolute inset-0 flex">
                            {months.map((month, i) => {
                              const daysInMonth = differenceInDays(endOfMonth(month), startOfMonth(month)) + 1;
                              const width = (daysInMonth / totalDays) * 100;
                              return (
                                <div
                                  key={i}
                                  className="border-l first:border-l-0 border-dashed"
                                  style={{ width: `${width}%` }}
                                />
                              );
                            })}
                          </div>
                          {/* Bar */}
                          <div
                            className="absolute top-1 h-8 rounded-md cursor-pointer hover:opacity-90 transition-opacity flex items-center px-2"
                            style={{
                              left: barPos.left,
                              width: barPos.width,
                              backgroundColor: milestone.color,
                              minWidth: "20px",
                            }}
                            onClick={() => handleOpenDialog(milestone)}
                          >
                            <span className="text-xs text-white font-medium truncate">
                              {milestone.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen milepæler ennå</h3>
            <p className="text-muted-foreground mb-4">
              Legg til milepæler for å planlegge prosjektfremdriften
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til første milepæl
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Milestone list for mobile */}
      {milestones.length > 0 && (
        <Card className="sm:hidden">
          <CardHeader>
            <CardTitle>Alle milepæler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="p-3 border rounded-lg space-y-2"
                style={{ borderLeftColor: milestone.color, borderLeftWidth: "4px" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{milestone.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(milestone.start_date), "d. MMM", { locale: nb })} - {format(parseISO(milestone.end_date), "d. MMM yyyy", { locale: nb })}
                    </p>
                  </div>
                  {getStatusBadge(milestone.status)}
                </div>
                <Progress value={milestone.progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{milestone.responsible_name || "Ingen ansvarlig"}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(milestone)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(milestone.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett milepæl?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne milepælen? Handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
