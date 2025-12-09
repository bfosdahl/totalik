import { useParams } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  Send, 
  Paperclip, 
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Users,
  Building2,
  FolderOpen,
  Plus,
  X,
} from "lucide-react";
import { 
  useProjectByggesak, 
  useByggesakForms,
} from "@/hooks/useKsModule2Byggesak";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { toast } from "sonner";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SentEmail {
  id: string;
  subject: string;
  recipients: string[];
  attachments: string[];
  sentAt: string;
  type: string;
}

export default function Ks2ByggesakEpost() {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects } = useKsModule2Projects();
  const project = projects?.find(p => p.id === projectId);
  const { data: byggesak, isLoading: byggesakLoading } = useProjectByggesak(projectId || "");
  const { data: forms, isLoading: formsLoading } = useByggesakForms(byggesak?.id);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [searchForms, setSearchForms] = useState("");

  // Mock sent emails for demo
  const [sentEmails] = useState<SentEmail[]>([
    {
      id: "1",
      subject: "Nabovarsel - Tilbygg Storgata 5",
      recipients: ["nabo1@example.com", "nabo2@example.com"],
      attachments: ["5154 Nabovarsel", "5156 Kvittering"],
      sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      type: "BygSøk",
    },
    {
      id: "2",
      subject: "Samsvarserklæring UTF - Tømrerarbeid",
      recipients: ["kommune@example.no"],
      attachments: ["5181 Samsvarserklæring UTF"],
      sentAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      type: "BygSøk",
    },
  ]);

  const isLoading = byggesakLoading || formsLoading;

  const signedForms = forms?.filter(f => ["signed", "sent", "uploaded"].includes(f.status)) || [];
  const filteredForms = signedForms.filter(f => 
    f.form_number.toLowerCase().includes(searchForms.toLowerCase()) ||
    f.form_name.toLowerCase().includes(searchForms.toLowerCase())
  );

  const addRecipient = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Ugyldig e-postadresse");
      return;
    }
    if (recipients.some(r => r.email === newEmail)) {
      toast.error("E-postadresse er allerede lagt til");
      return;
    }
    setRecipients([...recipients, { email: newEmail }]);
    setNewEmail("");
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r.email !== email));
  };

  const toggleForm = (formId: string) => {
    if (selectedForms.includes(formId)) {
      setSelectedForms(selectedForms.filter(id => id !== formId));
    } else {
      setSelectedForms([...selectedForms, formId]);
    }
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast.error("Legg til minst én mottaker");
      return;
    }
    if (!subject.trim()) {
      toast.error("Skriv inn emne");
      return;
    }
    if (selectedForms.length === 0) {
      toast.error("Velg minst én blankett som vedlegg");
      return;
    }

    setIsSending(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`E-post sendt til ${recipients.length} mottaker${recipients.length > 1 ? "e" : ""}`);
    
    // Reset form
    setRecipients([]);
    setSubject("");
    setMessage("");
    setSelectedForms([]);
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!byggesak) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Start byggesaken først for å sende e-post</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-orange-500" />
          E-post utsending
        </h1>
        <p className="text-muted-foreground">
          Send blanketter og dokumenter direkte til kommune, naboer eller andre
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose Email */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ny e-post</CardTitle>
            <CardDescription>Skriv melding og velg vedlegg</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipients */}
            <div className="space-y-2">
              <Label>Mottakere</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="E-postadresse"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                />
                <Button type="button" variant="secondary" onClick={addRecipient}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {recipients.map(r => (
                    <Badge key={r.email} variant="secondary" className="gap-1 pr-1">
                      {r.email}
                      <button onClick={() => removeRecipient(r.email)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Quick add */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setRecipients([...recipients, { email: "postmottak@kommune.no", name: "Kommune" }])}
              >
                <Building2 className="h-4 w-4 mr-1" />
                Kommune
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setRecipients([...recipients, { email: "byggherre@example.com", name: "Byggherre" }])}
              >
                <Users className="h-4 w-4 mr-1" />
                Byggherre
              </Button>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Emne</Label>
              <Input
                placeholder="Emne for e-post"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Melding</Label>
              <Textarea
                placeholder="Skriv din melding her..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Vedlegg ({selectedForms.length})
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i signerte blanketter..."
                  className="pl-10"
                  value={searchForms}
                  onChange={(e) => setSearchForms(e.target.value)}
                />
              </div>
              <ScrollArea className="h-40 border rounded-lg p-2">
                {filteredForms.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen signerte blanketter funnet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredForms.map(form => (
                      <div 
                        key={form.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleForm(form.id)}
                      >
                        <Checkbox 
                          checked={selectedForms.includes(form.id)}
                          onCheckedChange={() => toggleForm(form.id)}
                        />
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {form.form_number} {form.form_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Signert {form.signed_at ? new Date(form.signed_at).toLocaleDateString("nb-NO") : ""}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Signert
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Send Button */}
            <Button 
              className="w-full gap-2" 
              onClick={handleSend}
              disabled={isSending || recipients.length === 0 || selectedForms.length === 0}
            >
              {isSending ? (
                <>Sender...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send e-post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sent Emails Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Sendte e-poster
            </CardTitle>
            <CardDescription>Historikk over utgående e-poster</CardDescription>
          </CardHeader>
          <CardContent>
            {sentEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Ingen sendte e-poster ennå</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentEmails.map(email => (
                  <div key={email.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{email.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {email.recipients.join(", ")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {email.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(email.sentAt).toLocaleString("nb-NO")}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {email.attachments.map((att, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {att}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Prosjektinfo for e-post</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">Prosjekt</p>
              <p className="font-medium">{project?.project_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Adresse</p>
              <p className="font-medium">{byggesak.property_address || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kommune</p>
              <p className="font-medium">{byggesak.municipality || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gnr/Bnr</p>
              <p className="font-medium">{byggesak.gnr ? `${byggesak.gnr}/${byggesak.bnr || "-"}` : "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
