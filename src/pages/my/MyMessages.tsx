import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEmployeeMessages } from "@/hooks/useEmployeeMessages";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Send, Inbox, ArrowUpFromLine, Clock, Check, CheckCheck, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function MyMessages() {
  const { profile } = useAuth();
  const { receivedMessages, sentMessages, unreadCount, isLoading, sendMessage, markAsRead, deleteMessage } = useEmployeeMessages();
  const { users, getUserDisplayName } = useCompanyUsers();
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");

  const otherUsers = users.filter((u) => u.user_id !== profile?.user_id);

  const handleSend = () => {
    if (!recipientId || !messageText.trim()) return;
    const recipient = users.find((u) => u.id === recipientId);
    if (!recipient) return;
    sendMessage.mutate(
      {
        recipient_id: recipientId,
        recipient_name: getUserDisplayName(recipient),
        subject: subject.trim() || undefined,
        message: messageText.trim(),
      },
      {
        onSuccess: () => {
          setComposeOpen(false);
          setRecipientId("");
          setSubject("");
          setMessageText("");
        },
      }
    );
  };

  const handleOpenMessage = (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.is_read && msg.recipient_id === profile?.id) {
      markAsRead.mutate(msg.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const MessageCard = ({ msg, isSent }: { msg: any; isSent: boolean }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${!isSent && !msg.is_read ? "border-primary/40 bg-primary/5" : ""}`}
      onClick={() => handleOpenMessage(msg)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 mt-0.5">
            <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
              {getInitials(isSent ? msg.recipient_name : msg.sender_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">
                {isSent ? `Til: ${msg.recipient_name}` : msg.sender_name}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {!isSent && !msg.is_read && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">Ny</Badge>
                )}
                {isSent && (
                  msg.is_read
                    ? <CheckCheck className="h-3.5 w-3.5 text-primary" />
                    : <Check className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(msg.created_at), "dd. MMM HH:mm", { locale: nb })}
                </span>
              </div>
            </div>
            {msg.subject && (
              <p className="text-sm font-medium text-foreground/80 mt-0.5 truncate">{msg.subject}</p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{msg.message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Meldinger</h1>
              <p className="text-sm text-muted-foreground">Send og motta meldinger til kollegaer</p>
            </div>
          </div>
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ny melding
          </Button>
        </div>

        <Tabs defaultValue="inbox">
          <TabsList>
            <TabsTrigger value="inbox" className="gap-1.5">
              <Inbox className="h-4 w-4" />
              Innboks
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-1.5">
              <ArrowUpFromLine className="h-4 w-4" />
              Sendt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Laster meldinger...</p>
            ) : receivedMessages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Ingen meldinger i innboksen</p>
                </CardContent>
              </Card>
            ) : (
              receivedMessages.map((msg) => <MessageCard key={msg.id} msg={msg} isSent={false} />)
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Laster meldinger...</p>
            ) : sentMessages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Du har ikke sendt noen meldinger ennå</p>
                </CardContent>
              </Card>
            ) : (
              sentMessages.map((msg) => <MessageCard key={msg.id} msg={msg} isSent={true} />)
            )}
          </TabsContent>
        </Tabs>

        {/* Compose Dialog */}
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Ny melding
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Til</label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg mottaker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {otherUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserDisplayName(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Emne (valgfritt)</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="F.eks. Påminnelse om møte"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Melding</label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Skriv meldingen din her..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>Avbryt</Button>
              <Button
                onClick={handleSend}
                disabled={!recipientId || !messageText.trim() || sendMessage.isPending}
              >
                <Send className="h-4 w-4 mr-1" />
                {sendMessage.isPending ? "Sender..." : "Send melding"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Message Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-lg">
            {selectedMessage && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg">
                    {selectedMessage.subject || "Melding"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {getInitials(
                          selectedMessage.sender_id === profile?.id
                            ? selectedMessage.recipient_name
                            : selectedMessage.sender_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {selectedMessage.sender_id === profile?.id
                          ? `Til: ${selectedMessage.recipient_name}`
                          : `Fra: ${selectedMessage.sender_name}`}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(selectedMessage.created_at), "dd. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                  {selectedMessage.is_read && selectedMessage.read_at && selectedMessage.sender_id === profile?.id && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCheck className="h-3 w-3 text-primary" />
                      Lest {format(new Date(selectedMessage.read_at), "dd. MMM HH:mm", { locale: nb })}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  {selectedMessage.sender_id === profile?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        deleteMessage.mutate(selectedMessage.id);
                        setSelectedMessage(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Slett
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedMessage(null)}>Lukk</Button>
                  {selectedMessage.sender_id !== profile?.id && (
                    <Button
                      onClick={() => {
                        setRecipientId(selectedMessage.sender_id);
                        setSubject(`Re: ${selectedMessage.subject || ""}`);
                        setSelectedMessage(null);
                        setComposeOpen(true);
                      }}
                    >
                      Svar
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
