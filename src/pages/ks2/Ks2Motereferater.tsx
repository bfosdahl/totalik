import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Plus,
  FileText,
  Calendar,
  MapPin,
  Users,
  Search,
  Download,
  Mail,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useKsModule2Meetings, Meeting, MeetingItem, MeetingParticipant, NewMeetingItemInput } from "@/hooks/useKsModule2Meetings";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { generateMeetingPdf } from "@/utils/ksModule2MeetingPdf";
import { supabase } from "@/integrations/supabase/client";

const MEETING_TYPES = [
  "Byggemøte",
  "Byggherremøte",
  "Vernemøte",
  "Oppstartsmøte",
  "Koordineringsmøte",
  "Prosjekteringsmøte",
  "Overleveringsmøte",
  "Annet",
];

export default function Ks2Motereferater() {
  const { projectId } = useParams();
  const { toast } = useToast();
  const { meetings, isLoading, isSaving, createMeeting, updateMeeting, deleteMeeting, fetchMeetingItems, addMeetingItem, updateMeetingItem, deleteMeetingItem, refetch } = useKsModule2Meetings(projectId || null);
  const { projects } = useKsModule2Projects();
  const { users } = useCompanyUsers();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetingItems, setMeetingItems] = useState<MeetingItem[]>([]);
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    meeting_type: "Byggemøte",
    title: "",
    meeting_date: new Date().toISOString().slice(0, 16),
    location: "",
    agenda: "",
    notes: "",
    participants: [] as MeetingParticipant[],
  });

  // New item form
  const [newItemData, setNewItemData] = useState<NewMeetingItemInput>({
    topic: "",
    discussion: "",
    decision: "",
    responsible_name: "",
    deadline: "",
    status: "open",
  });

  // Participant form
  const [newParticipant, setNewParticipant] = useState<MeetingParticipant>({
    name: "",
    role: "",
    email: "",
    company: "",
  });

  const project = projects.find(p => p.id === projectId);

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = 
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.meeting_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.meeting_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || meeting.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateMeeting = async () => {
    if (!formData.title || !formData.meeting_date) {
      toast({
        title: "Feil",
        description: "Tittel og dato er påkrevd",
        variant: "destructive",
      });
      return;
    }

    const result = await createMeeting({
      ...formData,
      meeting_date: new Date(formData.meeting_date).toISOString(),
    });

    if (result) {
      setIsCreateDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateMeeting = async () => {
    if (!selectedMeeting) return;

    await updateMeeting(selectedMeeting.id, {
      ...formData,
      meeting_date: new Date(formData.meeting_date).toISOString(),
    });

    setIsEditDialogOpen(false);
    setSelectedMeeting(null);
  };

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;
    
    await deleteMeeting(selectedMeeting.id);
    setIsDeleteDialogOpen(false);
    setSelectedMeeting(null);
  };

  const handleCompleteMeeting = async (meeting: Meeting) => {
    await updateMeeting(meeting.id, { status: "completed" });
  };

  const resetForm = () => {
    setFormData({
      meeting_type: "Byggemøte",
      title: "",
      meeting_date: new Date().toISOString().slice(0, 16),
      location: "",
      agenda: "",
      notes: "",
      participants: [],
    });
  };

  const openEditDialog = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setFormData({
      meeting_type: meeting.meeting_type,
      title: meeting.title,
      meeting_date: new Date(meeting.meeting_date).toISOString().slice(0, 16),
      location: meeting.location || "",
      agenda: meeting.agenda || "",
      notes: meeting.notes || "",
      participants: meeting.participants || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDetailDialog = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    const items = await fetchMeetingItems(meeting.id);
    setMeetingItems(items);
    setIsDetailDialogOpen(true);
  };

  const handleAddParticipant = () => {
    if (!newParticipant.name) return;
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { ...newParticipant }],
    }));
    setNewParticipant({ name: "", role: "", email: "", company: "" });
  };

  const handleRemoveParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }));
  };

  const handleAddItem = async () => {
    if (!selectedMeeting || !newItemData.topic) return;
    
    const item = await addMeetingItem(selectedMeeting.id, newItemData);
    if (item) {
      setMeetingItems(prev => [...prev, item]);
      setNewItemData({
        topic: "",
        discussion: "",
        decision: "",
        responsible_name: "",
        deadline: "",
        status: "open",
      });
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: "open" | "in_progress" | "completed") => {
    const success = await updateMeetingItem(itemId, { status });
    if (success) {
      setMeetingItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status } : item
      ));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const success = await deleteMeetingItem(itemId);
    if (success) {
      setMeetingItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleDownloadPdf = async (meeting: Meeting) => {
    try {
      const items = await fetchMeetingItems(meeting.id);
      const blob = await generateMeetingPdf({
        meeting,
        items,
        projectName: project?.project_name || "",
        projectNumber: project?.project_number || "",
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meeting.meeting_number}_${meeting.title.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke generere PDF",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (meeting: Meeting) => {
    const emailParticipants = meeting.participants.filter(p => p.email);
    
    if (emailParticipants.length === 0) {
      toast({
        title: "Ingen mottakere",
        description: "Ingen deltakere har registrert e-post",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSendingEmail(true);
      const items = await fetchMeetingItems(meeting.id);
      
      const { error } = await supabase.functions.invoke("send-meeting-minutes", {
        body: {
          meeting,
          items,
          projectName: project?.project_name || "",
          projectNumber: project?.project_number || "",
          recipients: emailParticipants.map(p => p.email),
        },
      });

      if (error) throw error;

      await updateMeeting(meeting.id, { status: "sent" });

      toast({
        title: "Sendt",
        description: `Møtereferat sendt til ${emailParticipants.length} deltaker(e)`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende e-post",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Fullført</Badge>;
      case "sent":
        return <Badge className="bg-blue-500">Sendt</Badge>;
      default:
        return <Badge variant="secondary">Utkast</Badge>;
    }
  };

  const stats = {
    total: meetings.length,
    draft: meetings.filter(m => m.status === "draft").length,
    completed: meetings.filter(m => m.status === "completed").length,
    sent: meetings.filter(m => m.status === "sent").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Møtereferater</h1>
          <p className="text-muted-foreground">Dokumenter og del møter fra prosjektet</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nytt møtereferat
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totalt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Utkast</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Fullført</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-muted-foreground">Sendt</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk i møtereferater..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="draft">Utkast</SelectItem>
            <SelectItem value="completed">Fullført</SelectItem>
            <SelectItem value="sent">Sendt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meetings list */}
      {filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Ingen møtereferater</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Opprett ditt første møtereferat for å komme i gang
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nytt møtereferat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-muted-foreground">
                        {meeting.meeting_number}
                      </span>
                      {getStatusBadge(meeting.status)}
                      <Badge variant="outline">{meeting.meeting_type}</Badge>
                    </div>
                    <h3 
                      className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                      onClick={() => openDetailDialog(meeting)}
                    >
                      {meeting.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(meeting.meeting_date), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                      </div>
                      {meeting.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {meeting.location}
                        </div>
                      )}
                      {meeting.participants.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {meeting.participants.length} deltaker(e)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {meeting.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompleteMeeting(meeting)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Fullfør
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(meeting)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {meeting.participants.some(p => p.email) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(meeting)}
                        disabled={isSendingEmail}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(meeting)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedMeeting(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Rediger møtereferat" : "Nytt møtereferat"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Møtetype</Label>
                <Select
                  value={formData.meeting_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dato og tid *</Label>
                <Input
                  type="datetime-local"
                  value={formData.meeting_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tittel *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="F.eks. Byggemøte #12"
              />
            </div>

            <div className="space-y-2">
              <Label>Sted</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="F.eks. Byggeplass eller Teams"
              />
            </div>

            {/* Participants */}
            <div className="space-y-2">
              <Label>Deltakere</Label>
              {formData.participants.length > 0 && (
                <div className="space-y-2 mb-2">
                  {formData.participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-secondary/30 rounded">
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{p.name}</span>
                        {p.role && <span className="text-muted-foreground"> - {p.role}</span>}
                        {p.email && <span className="text-muted-foreground text-xs ml-2">({p.email})</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Input
                  placeholder="Navn"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Rolle"
                  value={newParticipant.role}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value }))}
                />
                <Input
                  placeholder="E-post"
                  type="email"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                />
                <Button variant="outline" onClick={handleAddParticipant}>
                  <Plus className="w-4 h-4 mr-1" />
                  Legg til
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Agenda</Label>
              <Textarea
                value={formData.agenda}
                onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                placeholder="Hovedpunkter for møtet..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Generelle notater</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Oppsummering og øvrige notater..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Avbryt
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleUpdateMeeting : handleCreateMeeting}
              disabled={isSaving}
            >
              {isSaving ? "Lagrer..." : isEditDialogOpen ? "Lagre endringer" : "Opprett møtereferat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedMeeting?.title}</span>
              {selectedMeeting && getStatusBadge(selectedMeeting.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedMeeting && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Meeting info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nummer</span>
                    <p className="font-medium">{selectedMeeting.meeting_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium">{selectedMeeting.meeting_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dato</span>
                    <p className="font-medium">
                      {format(new Date(selectedMeeting.meeting_date), "d. MMM yyyy HH:mm", { locale: nb })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sted</span>
                    <p className="font-medium">{selectedMeeting.location || "-"}</p>
                  </div>
                </div>

                {/* Participants */}
                {selectedMeeting.participants.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Deltakere</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeeting.participants.map((p, i) => (
                        <Badge key={i} variant="secondary">
                          {p.name}{p.role && ` (${p.role})`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agenda */}
                {selectedMeeting.agenda && (
                  <div>
                    <h4 className="font-medium mb-2">Agenda</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedMeeting.agenda}</p>
                  </div>
                )}

                <Separator />

                {/* Meeting items */}
                <div>
                  <h4 className="font-medium mb-4">Saker og oppfølgingspunkter</h4>
                  
                  {meetingItems.length > 0 ? (
                    <div className="space-y-3">
                      {meetingItems.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm text-muted-foreground">
                                    #{item.item_number}
                                  </span>
                                  <span className="font-medium">{item.topic}</span>
                                </div>
                                {item.decision && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Beslutning:</strong> {item.decision}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                                  {item.responsible_name && (
                                    <span>Ansvarlig: {item.responsible_name}</span>
                                  )}
                                  {item.deadline && (
                                    <span>Frist: {format(new Date(item.deadline), "dd.MM.yyyy")}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={item.status}
                                  onValueChange={(value) => handleUpdateItemStatus(item.id, value as any)}
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Åpen</SelectItem>
                                    <SelectItem value="in_progress">Pågår</SelectItem>
                                    <SelectItem value="completed">Fullført</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen saker registrert</p>
                  )}

                  {/* Add new item */}
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <h5 className="text-sm font-medium mb-3">Legg til ny sak</h5>
                      <div className="space-y-3">
                        <Input
                          placeholder="Sak/tema"
                          value={newItemData.topic}
                          onChange={(e) => setNewItemData(prev => ({ ...prev, topic: e.target.value }))}
                        />
                        <Textarea
                          placeholder="Beslutning"
                          value={newItemData.decision}
                          onChange={(e) => setNewItemData(prev => ({ ...prev, decision: e.target.value }))}
                          rows={2}
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <Select
                            value={newItemData.responsible_name || ""}
                            onValueChange={(value) => setNewItemData(prev => ({ ...prev, responsible_name: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ansvarlig" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map(user => (
                                <SelectItem key={user.id} value={`${user.first_name} ${user.last_name}`}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            value={newItemData.deadline || ""}
                            onChange={(e) => setNewItemData(prev => ({ ...prev, deadline: e.target.value }))}
                          />
                          <Button onClick={handleAddItem}>
                            <Plus className="w-4 h-4 mr-1" />
                            Legg til
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {selectedMeeting.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Notater</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedMeeting.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Lukk
            </Button>
            {selectedMeeting && (
              <>
                <Button variant="outline" onClick={() => handleDownloadPdf(selectedMeeting)}>
                  <Download className="w-4 h-4 mr-2" />
                  Last ned PDF
                </Button>
                {selectedMeeting.participants.some(p => p.email) && (
                  <Button onClick={() => handleSendEmail(selectedMeeting)} disabled={isSendingEmail}>
                    <Mail className="w-4 h-4 mr-2" />
                    {isSendingEmail ? "Sender..." : "Send til deltakere"}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett møtereferat</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{selectedMeeting?.title}"? 
              Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeeting}>Slett</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
