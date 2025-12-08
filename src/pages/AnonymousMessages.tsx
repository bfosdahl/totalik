import { useState } from "react";
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
import { 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  Loader2,
  Filter,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  useAnonymousMessages, 
  useAnonymousMessageDiscussions,
  AnonymousMessage 
} from "@/hooks/useAnonymousMessages";

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
  in_progress: { label: "Under behandling", color: "bg-yellow-500", icon: <AlertTriangle className="h-3 w-3" /> },
  resolved: { label: "Løst", color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3" /> },
};

export default function AnonymousMessages() {
  const { messages, isLoading, updateStatus } = useAnonymousMessages();
  const [selectedMessage, setSelectedMessage] = useState<AnonymousMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMessages = messages.filter((msg) => {
    const matchesStatus = statusFilter === "all" || msg.status === statusFilter;
    const matchesSearch = 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const newCount = messages.filter((m) => m.status === "new").length;
  const inProgressCount = messages.filter((m) => m.status === "in_progress").length;

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{newCount}</p>
                  <p className="text-sm text-muted-foreground">Nye meldinger</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                  <p className="text-sm text-muted-foreground">Under behandling</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{messages.length}</p>
                  <p className="text-sm text-muted-foreground">Totalt mottatt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrer meldinger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Søk i meldinger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrer status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  <SelectItem value="new">Nye</SelectItem>
                  <SelectItem value="in_progress">Under behandling</SelectItem>
                  <SelectItem value="resolved">Løst</SelectItem>
                </SelectContent>
              </Select>
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
                {searchTerm || statusFilter !== "all" 
                  ? "Ingen meldinger matcher filteret"
                  : "Det er ikke mottatt noen anonyme meldinger ennå"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => (
              <Card key={msg.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
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
                      </div>
                      <h3 className="font-semibold">{msg.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {msg.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mottatt: {format(new Date(msg.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedMessage(msg)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Åpne
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Message detail dialog */}
        <MessageDetailDialog
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onUpdateStatus={(status) => {
            if (selectedMessage) {
              updateStatus.mutate({ id: selectedMessage.id, status });
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
  onUpdateStatus 
}: { 
  message: AnonymousMessage | null;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
}) {
  const { discussions, isLoading, addDiscussion } = useAnonymousMessageDiscussions(message?.id || null);
  const [newComment, setNewComment] = useState("");

  if (!message) return null;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addDiscussion.mutateAsync(newComment);
    setNewComment("");
  };

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
                <p className="text-xs text-muted-foreground mt-1">
                  Mottatt: {format(new Date(message.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
