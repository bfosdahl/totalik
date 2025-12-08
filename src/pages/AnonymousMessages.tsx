import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  Loader2,
  Filter,
  Eye,
  Search,
  ArrowUpDown,
  Calendar,
  Trash2,
  Info
} from "lucide-react";
import { format, differenceInDays, subYears } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useAnonymousMessages, 
  useAnonymousMessageDiscussions,
  AnonymousMessage 
} from "@/hooks/useAnonymousMessages";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  arbeidsmiljo: "Arbeidsmiljø",
  sikkerhet: "Sikkerhet",
  trakassering: "Trakassering",
  diskriminering: "Diskriminering",
  regelbrudd: "Regelbrudd",
  annet: "Annet",
  generelt: "Generelt",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "Ny", color: "bg-blue-500", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "Under behandling", color: "bg-amber-500", icon: <AlertTriangle className="h-3 w-3" /> },
  resolved: { label: "Løst", color: "bg-emerald-500", icon: <CheckCircle2 className="h-3 w-3" /> },
};

type SortOption = "newest" | "oldest" | "status";

export default function AnonymousMessages() {
  const { messages, isLoading, updateStatus, deleteMessage } = useAnonymousMessages();
  const [selectedMessage, setSelectedMessage] = useState<AnonymousMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [activeTab, setActiveTab] = useState("active");

  // Calculate message age and identify old messages
  const { activeMessages, archivedMessages, expiredMessages } = useMemo(() => {
    const now = new Date();
    const twoYearsAgo = subYears(now, 2);
    
    const active: AnonymousMessage[] = [];
    const archived: AnonymousMessage[] = [];
    const expired: AnonymousMessage[] = [];
    
    messages.forEach((msg) => {
      const createdAt = new Date(msg.created_at);
      if (createdAt < twoYearsAgo) {
        expired.push(msg);
      } else if (msg.status === "resolved") {
        archived.push(msg);
      } else {
        active.push(msg);
      }
    });
    
    return { activeMessages: active, archivedMessages: archived, expiredMessages: expired };
  }, [messages]);

  // Get messages based on active tab
  const tabMessages = activeTab === "active" ? activeMessages : 
                      activeTab === "archived" ? archivedMessages : 
                      expiredMessages;

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    let filtered = tabMessages.filter((msg) => {
      const matchesStatus = statusFilter === "all" || msg.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || msg.category === categoryFilter;
      const matchesSearch = 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message_number.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesCategory && matchesSearch;
    });

    // Sort messages
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        // Sort by status: new -> in_progress -> resolved
        const statusOrder = { new: 0, in_progress: 1, resolved: 2 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
               (statusOrder[b.status as keyof typeof statusOrder] || 0);
      }
    });

    return filtered;
  }, [tabMessages, statusFilter, categoryFilter, searchTerm, sortBy]);

  // Get unique categories from messages
  const uniqueCategories = useMemo(() => {
    return [...new Set(messages.map(m => m.category))];
  }, [messages]);

  const newCount = activeMessages.filter((m) => m.status === "new").length;
  const inProgressCount = activeMessages.filter((m) => m.status === "in_progress").length;

  const handleDeleteExpired = async () => {
    if (expiredMessages.length === 0) return;
    
    const confirmed = window.confirm(
      `Er du sikker på at du vil slette ${expiredMessages.length} meldinger som er eldre enn 2 år? Dette kan ikke angres.`
    );
    
    if (confirmed) {
      for (const msg of expiredMessages) {
        await deleteMessage.mutateAsync(msg.id);
      }
      toast.success(`${expiredMessages.length} gamle meldinger slettet`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Anonyme meldinger
          </h1>
          <p className="text-muted-foreground mt-1">
            Meldinger sendt anonymt fra ansatte. Kun ledere og verneombud har tilgang.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-bold">{newCount}</p>
                  <p className="text-xs text-muted-foreground">Nye</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-bold">{inProgressCount}</p>
                  <p className="text-xs text-muted-foreground">Under behandling</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold">{archivedMessages.length}</p>
                  <p className="text-xs text-muted-foreground">Løst</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{messages.length}</p>
                  <p className="text-xs text-muted-foreground">Totalt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expired messages warning */}
        {expiredMessages.length > 0 && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span>
                <strong>{expiredMessages.length} meldinger</strong> er eldre enn 2 år og kan slettes for å overholde personvernrutiner.
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteExpired}
                className="border-amber-500/50 hover:bg-amber-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slett gamle meldinger
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Aktive ({activeMessages.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Arkivert ({archivedMessages.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eldre enn 2 år ({expiredMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søk på emne, innhold eller meldingsnummer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle statuser</SelectItem>
                        <SelectItem value="new">Nye</SelectItem>
                        <SelectItem value="in_progress">Under behandling</SelectItem>
                        <SelectItem value="resolved">Løst</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle kategorier</SelectItem>
                        {uniqueCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoryLabels[cat] || cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                      <SelectTrigger className="w-full sm:w-40">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Sorter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Nyeste først</SelectItem>
                        <SelectItem value="oldest">Eldste først</SelectItem>
                        <SelectItem value="status">Etter status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages list */}
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">Ingen meldinger</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                      ? "Ingen meldinger matcher filteret"
                      : activeTab === "active" 
                        ? "Det er ingen aktive meldinger å behandle"
                        : activeTab === "archived"
                          ? "Det er ingen arkiverte meldinger"
                          : "Det er ingen meldinger eldre enn 2 år"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Viser {filteredMessages.length} av {tabMessages.length} meldinger
                </p>
                {filteredMessages.map((msg) => {
                  const daysOld = differenceInDays(new Date(), new Date(msg.created_at));
                  return (
                    <Card 
                      key={msg.id} 
                      className="hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedMessage(msg)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-mono">
                                {msg.message_number}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {categoryLabels[msg.category] || msg.category}
                              </Badge>
                              <Badge 
                                className={`text-xs text-white ${statusConfig[msg.status]?.color || "bg-gray-500"}`}
                              >
                                <span className="mr-1">{statusConfig[msg.status]?.icon}</span>
                                {statusConfig[msg.status]?.label || msg.status}
                              </Badge>
                              {daysOld > 365 && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                  {Math.floor(daysOld / 365)} år gammel
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold">{msg.subject}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {msg.message}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Mottatt: {format(new Date(msg.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMessage(msg);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Åpne
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Message detail dialog */}
        <MessageDetailDialog
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onUpdateStatus={(status) => {
            if (selectedMessage) {
              updateStatus.mutate({ id: selectedMessage.id, status });
            }
          }}
          onDelete={() => {
            if (selectedMessage) {
              deleteMessage.mutate(selectedMessage.id, {
                onSuccess: () => {
                  setSelectedMessage(null);
                  toast.success("Melding slettet");
                }
              });
            }
          }}
        />
      </div>
    </AppLayout>
  );
}

function MessageDetailDialog({ 
  message, 
  onClose,
  onUpdateStatus,
  onDelete
}: { 
  message: AnonymousMessage | null;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  onDelete: () => void;
}) {
  const { discussions, isLoading, addDiscussion } = useAnonymousMessageDiscussions(message?.id || null);
  const [newComment, setNewComment] = useState("");

  if (!message) return null;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addDiscussion.mutateAsync(newComment);
    setNewComment("");
  };

  const daysOld = differenceInDays(new Date(), new Date(message.created_at));
  const isExpired = daysOld > 730; // 2 years

  return (
    <Dialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {message.message_number}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6">
            {/* Expired warning */}
            {isExpired && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <Calendar className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  Denne meldingen er over 2 år gammel og bør vurderes for sletting.
                </AlertDescription>
              </Alert>
            )}

            {/* Message content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">
                  {categoryLabels[message.category] || message.category}
                </Badge>
                <Select 
                  value={message.status} 
                  onValueChange={onUpdateStatus}
                >
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Ny</SelectItem>
                    <SelectItem value="in_progress">Under behandling</SelectItem>
                    <SelectItem value="resolved">Løst</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{message.subject}</h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Mottatt: {format(new Date(message.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                  <span className="mx-1">•</span>
                  {daysOld} dager siden
                </p>
              </div>

              <Alert className="border-primary/30 bg-primary/5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  Denne meldingen er sendt anonymt. Avsenders identitet er ikke kjent.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{message.message}</p>
              </div>
            </div>

            <Separator />

            {/* Internal discussion */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Intern diskusjon (kun for ledere og verneombud)
              </h4>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : discussions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ingen kommentarer ennå. Start diskusjonen nedenfor.
                </p>
              ) : (
                <div className="space-y-3">
                  {discussions.map((disc) => (
                    <div key={disc.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{disc.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(disc.created_at), "d. MMM HH:mm", { locale: nb })}
                        </span>
                      </div>
                      <p className="text-sm">{disc.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Skriv en intern kommentar..."
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addDiscussion.isPending}
                  size="icon"
                  className="h-auto"
                >
                  {addDiscussion.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm("Er du sikker på at du vil slette denne meldingen? Dette kan ikke angres.")) {
                    onDelete();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slett melding
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
