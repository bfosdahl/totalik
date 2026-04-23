import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  HardHat,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Search,
  ClipboardCheck,
  CheckCircle2,
  Users,
} from "lucide-react";

interface CrewMember {
  id: string;
  user_id: string;
  display_name: string;
  project_role: string | null;
  responsibilities: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface ChecklistAssignment {
  id: string;
  title: string | null;
  template_name: string | null;
  status: string;
  responsible_user_id: string | null;
  responsible_user_name: string | null;
  deadline_date: string | null;
}

const ROLE_OPTIONS = [
  "Prosjektleder",
  "Bas / Formann",
  "Byggeleder",
  "Verneombud",
  "HMS-ansvarlig",
  "Tømrer",
  "Murer",
  "Elektriker",
  "Rørlegger",
  "Maler",
  "Hjelpearbeider",
  "Lærling",
  "Annet",
];

export default function Ks2Mannskap() {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile, isCompanyAdmin } = useAuth();
  const { users: companyUsers, isLoading: usersLoading, getUserDisplayName } = useCompanyUsers();

  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [checklists, setChecklists] = useState<ChecklistAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [projectRole, setProjectRole] = useState<string>("");
  const [customRole, setCustomRole] = useState<string>("");
  const [responsibilities, setResponsibilities] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Assign checklist dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningMember, setAssigningMember] = useState<CrewMember | null>(null);
  const [selectedChecklists, setSelectedChecklists] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  const canManage = isCompanyAdmin;

  const fetchData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [crewRes, checklistRes] = await Promise.all([
        supabase
          .from("ks_module2_project_crew")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
        supabase
          .from("ks_module2_checklists")
          .select("id, title, template_name, status, responsible_user_id, responsible_user_name, deadline_date")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
      ]);

      if (crewRes.error) throw crewRes.error;
      if (checklistRes.error) throw checklistRes.error;

      setCrew(crewRes.data || []);
      setChecklists(checklistRes.data || []);
    } catch (err: any) {
      console.error("Error loading crew:", err);
      toast.error("Kunne ikke laste mannskap: " + (err.message || "Ukjent feil"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const resetForm = () => {
    setEditingMember(null);
    setSelectedUserId("");
    setProjectRole("");
    setCustomRole("");
    setResponsibilities("");
    setStartDate("");
    setEndDate("");
    setNotes("");
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (member: CrewMember) => {
    setEditingMember(member);
    setSelectedUserId(member.user_id);
    if (ROLE_OPTIONS.includes(member.project_role || "")) {
      setProjectRole(member.project_role || "");
      setCustomRole("");
    } else if (member.project_role) {
      setProjectRole("Annet");
      setCustomRole(member.project_role);
    } else {
      setProjectRole("");
      setCustomRole("");
    }
    setResponsibilities(member.responsibilities || "");
    setStartDate(member.start_date || "");
    setEndDate(member.end_date || "");
    setNotes(member.notes || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!projectId || !profile?.company_id) return;
    if (!selectedUserId) {
      toast.error("Velg en ansatt");
      return;
    }

    const finalRole = projectRole === "Annet" ? customRole.trim() : projectRole;
    const user = companyUsers.find((u) => u.user_id === selectedUserId);
    if (!user) {
      toast.error("Ugyldig bruker");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        project_id: projectId,
        company_id: profile.company_id,
        user_id: selectedUserId,
        display_name: getUserDisplayName(user),
        project_role: finalRole || null,
        responsibilities: responsibilities.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes.trim() || null,
      };

      if (editingMember) {
        const { error } = await supabase
          .from("ks_module2_project_crew")
          .update(payload)
          .eq("id", editingMember.id);
        if (error) throw error;
        toast.success("Mannskap oppdatert");
      } else {
        const { error } = await supabase
          .from("ks_module2_project_crew")
          .insert({ ...payload, added_by: profile.user_id });
        if (error) {
          if (error.code === "23505") {
            toast.error("Denne ansatte er allerede lagt til på prosjektet");
            return;
          }
          throw error;
        }
        toast.success("Mannskap lagt til");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error("Kunne ikke lagre: " + (err.message || "Ukjent feil"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("ks_module2_project_crew")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast.success("Fjernet fra mannskap");
      setDeleteId(null);
      fetchData();
    } catch (err: any) {
      toast.error("Kunne ikke slette: " + (err.message || "Ukjent feil"));
    }
  };

  const openAssignDialog = (member: CrewMember) => {
    setAssigningMember(member);
    const already = new Set(
      checklists.filter((c) => c.responsible_user_id === member.user_id).map((c) => c.id)
    );
    setSelectedChecklists(already);
    setAssignDialogOpen(true);
  };

  const toggleChecklist = (id: string) => {
    setSelectedChecklists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssignChecklists = async () => {
    if (!assigningMember) return;
    setIsAssigning(true);
    try {
      // Find currently assigned checklists for this member
      const previouslyAssigned = checklists
        .filter((c) => c.responsible_user_id === assigningMember.user_id)
        .map((c) => c.id);

      // Add: in selectedChecklists but not previously assigned
      const toAssign = Array.from(selectedChecklists).filter(
        (id) => !previouslyAssigned.includes(id)
      );
      // Remove: previously assigned but not in selectedChecklists
      const toUnassign = previouslyAssigned.filter((id) => !selectedChecklists.has(id));

      if (toAssign.length > 0) {
        const { error } = await supabase
          .from("ks_module2_checklists")
          .update({
            responsible_user_id: assigningMember.user_id,
            responsible_user_name: assigningMember.display_name,
          })
          .in("id", toAssign);
        if (error) throw error;
      }
      if (toUnassign.length > 0) {
        const { error } = await supabase
          .from("ks_module2_checklists")
          .update({
            responsible_user_id: null,
            responsible_user_name: null,
          })
          .in("id", toUnassign);
        if (error) throw error;
      }

      toast.success("Sjekklister oppdatert");
      setAssignDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Kunne ikke oppdatere: " + (err.message || "Ukjent feil"));
    } finally {
      setIsAssigning(false);
    }
  };

  // Available users (not yet on crew, except when editing)
  const availableUsers = useMemo(() => {
    const usedIds = new Set(crew.map((c) => c.user_id));
    if (editingMember) usedIds.delete(editingMember.user_id);
    return companyUsers.filter((u) => !usedIds.has(u.user_id));
  }, [companyUsers, crew, editingMember]);

  const filteredCrew = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return crew;
    return crew.filter(
      (c) =>
        c.display_name.toLowerCase().includes(q) ||
        (c.project_role || "").toLowerCase().includes(q) ||
        (c.responsibilities || "").toLowerCase().includes(q)
    );
  }, [crew, search]);

  const checklistsForMember = (userId: string) =>
    checklists.filter((c) => c.responsible_user_id === userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <HardHat className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mannskapsliste</h2>
            <p className="text-muted-foreground">
              Oversikt over ansatte på prosjektet og delegering av sjekklister
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Legg til mannskap
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Totalt mannskap</p>
                <p className="text-2xl font-bold">{crew.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aktive</p>
                <p className="text-2xl font-bold">{crew.filter((c) => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sjekklister tildelt</p>
                <p className="text-2xl font-bold">
                  {checklists.filter((c) => c.responsible_user_id).length} / {checklists.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk i mannskap..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Crew table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mannskap på prosjektet</CardTitle>
          <CardDescription>
            Klikk på en person for å delegere sjekklister og se detaljer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCrew.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HardHat className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Ingen mannskap er lagt til ennå</p>
              {canManage && (
                <p className="text-sm mt-1">Klikk "Legg til mannskap" for å komme i gang</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Sjekklister</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCrew.map((member) => {
                    const memberChecklists = checklistsForMember(member.user_id);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium">{member.display_name}</div>
                          {member.responsibilities && (
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {member.responsibilities}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.project_role ? (
                            <Badge variant="secondary">{member.project_role}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.start_date || member.end_date ? (
                            <>
                              {member.start_date
                                ? format(new Date(member.start_date), "d. MMM yyyy", { locale: nb })
                                : "…"}
                              {" – "}
                              {member.end_date
                                ? format(new Date(member.end_date), "d. MMM yyyy", { locale: nb })
                                : "pågående"}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={memberChecklists.length > 0 ? "default" : "outline"}>
                            {memberChecklists.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canManage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openAssignDialog(member)}
                                  title="Tildel sjekklister"
                                >
                                  <ClipboardCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(member)}
                                  title="Rediger"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteId(member.id)}
                                  title="Fjern"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Rediger mannskap" : "Legg til mannskap"}
            </DialogTitle>
            <DialogDescription>
              Velg en ansatt fra bedriften og angi rolle og ansvarsområder på prosjektet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Ansatt *</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={!!editingMember || usersLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Velg ansatt..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      Ingen flere ansatte å legge til
                    </div>
                  ) : (
                    availableUsers.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {getUserDisplayName(u)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rolle på prosjektet</Label>
              <Select value={projectRole} onValueChange={setProjectRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Velg rolle..." />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projectRole === "Annet" && (
                <Input
                  className="mt-2"
                  placeholder="Skriv inn rolle..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Startdato</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Sluttdato</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Ansvarsområder</Label>
              <Textarea
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="F.eks. ansvarlig for taktekking, sikring av stillas..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Notater</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Interne notater..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMember ? "Lagre endringer" : "Legg til"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign checklists dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tildel sjekklister</DialogTitle>
            <DialogDescription>
              Velg hvilke sjekklister {assigningMember?.display_name} skal være ansvarlig for.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {checklists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Ingen sjekklister på prosjektet ennå
              </p>
            ) : (
              checklists.map((c) => {
                const isSelected = selectedChecklists.has(c.id);
                const otherOwner =
                  c.responsible_user_id &&
                  c.responsible_user_id !== assigningMember?.user_id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChecklist(c.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {c.title || c.template_name || "Uten navn"}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {c.status}
                          </Badge>
                          {otherOwner && c.responsible_user_name && (
                            <span className="text-xs text-muted-foreground">
                              Nå: {c.responsible_user_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAssignChecklists} disabled={isAssigning}>
              {isAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjerne fra mannskap?</AlertDialogTitle>
            <AlertDialogDescription>
              Personen fjernes fra prosjektets mannskapsliste. Eventuelle sjekklister
              denne personen er ansvarlig for vil beholde tildelingen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Fjern</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
