import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Phone, FileText, Upload, Trash2, Download, Calendar, CheckCircle, Clock, AlertCircle, XCircle, ClipboardCheck, Key, Mail, RefreshCw, UserX } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKsModule2Subcontractors, useKsModule2SubcontractorDocuments } from "@/hooks/useKsModule2Subcontractors";
import { useKsModule2ProjectAccess } from "@/hooks/useKsModule2ProjectAccess";
import { Ks2SubcontractorEvaluation } from "@/components/ks2/Ks2SubcontractorEvaluation";
import { Ks2SubcontractorDocumentUpload } from "@/components/ks2/Ks2SubcontractorDocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Venter på gransking", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Godkjent", color: "bg-green-100 text-green-800", icon: CheckCircle },
  approved_with_remarks: { label: "Godkjent med merknader", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  rejected: { label: "Avvist", color: "bg-red-100 text-red-800", icon: XCircle },
};

const documentTypeLabels: Record<string, string> = {
  contract: "Kontrakt", insurance: "Forsikring", certification: "Sertifisering", competence: "Kompetanse", hms_card: "HMS-kort", other: "Annet",
};

interface Props { subcontractorId: string; }

export default function Ks2UnderleverandorDetail({ subcontractorId }: Props) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [resending, setResending] = useState(false);

  const { subcontractors, isLoading } = useKsModule2Subcontractors(projectId || null);
  const { documents, downloadDocument, deleteDocument, isLoading: docsLoading } = useKsModule2SubcontractorDocuments(subcontractorId);
  const { accessList, revokeAccess } = useKsModule2ProjectAccess(projectId || null);

  const subcontractor = subcontractors.find(s => s.id === subcontractorId);
  const access = accessList.find(a => a.subcontractor_id === subcontractorId);

  const handleResendInvitation = async () => {
    if (!access || !projectId) return;
    
    setResending(true);
    try {
      // Generate new temp password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let newPassword = '';
      for (let i = 0; i < 10; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Update the access record with new password
      await supabase
        .from("ks_module2_project_access")
        .update({ temp_password: newPassword, status: 'invited' })
        .eq("id", access.id);

      // Call edge function to create/update user and send email
      const { error } = await supabase.functions.invoke('invite-ue-access', {
        body: {
          email: access.email,
          name: access.name,
          company_name: access.company_name,
          temp_password: newPassword,
          project_id: projectId,
          access_level: access.access_level,
        }
      });

      if (error) throw error;

      toast.success("Invitasjon sendt på nytt!", {
        description: `Nytt passord: ${newPassword}`,
        duration: 10000,
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Kunne ikke sende invitasjon");
    } finally {
      setResending(false);
    }
  };

  if (isLoading) return <p className="text-center py-8 text-muted-foreground">Laster...</p>;
  if (!subcontractor) return <p className="text-center py-8 text-muted-foreground">Underleverandør ikke funnet</p>;

  const status = statusConfig[subcontractor.approval_status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/ks2/project/${projectId}/underleverandorer`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold">{subcontractor.firm_name}</h2>
            <Badge className={status.color}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge>
            {access && access.access_level !== 'none' && (
              <Badge variant="outline" className="border-primary text-primary">
                <Key className="h-3 w-3 mr-1" />Har tilgang
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{subcontractor.work_scope}</p>
        </div>
      </div>

      {/* Access Card - Show if subcontractor has access */}
      {access && access.access_level !== 'none' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Gjestetilgang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">E-post:</span>
                <span className="ml-2 font-medium">{access.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tilgangsnivå:</span>
                <span className="ml-2 font-medium">{access.access_level === 'guest' ? 'Gjest' : 'Full UE'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="ml-2">
                  {access.status === 'invited' ? 'Invitert' : access.status === 'active' ? 'Aktiv' : access.status === 'expired' ? 'Utløpt' : 'Fjernet'}
                </Badge>
              </div>
              {access.last_login && (
                <div>
                  <span className="text-muted-foreground">Siste innlogging:</span>
                  <span className="ml-2">{format(new Date(access.last_login), 'dd.MM.yyyy HH:mm', { locale: nb })}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleResendInvitation}
                disabled={resending}
              >
                {resending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send invitasjon på nytt
              </Button>
              {access.status !== 'revoked' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => revokeAccess.mutate(access.id)}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Fjern tilgang
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />Firmainformasjon</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {subcontractor.org_number && <div className="flex justify-between"><span className="text-muted-foreground">Org.nr</span><span>{subcontractor.org_number}</span></div>}
            {subcontractor.trade && <div className="flex justify-between"><span className="text-muted-foreground">Fag</span><span>{subcontractor.trade}</span></div>}
            {subcontractor.contract_value && <div className="flex justify-between"><span className="text-muted-foreground">Verdi</span><span>{subcontractor.contract_value.toLocaleString('nb-NO')} kr</span></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" />Kontakt</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {subcontractor.contact_person && <div className="flex justify-between"><span className="text-muted-foreground">Navn</span><span>{subcontractor.contact_person}</span></div>}
            {subcontractor.contact_phone && <div className="flex justify-between"><span className="text-muted-foreground">Tlf</span><a href={`tel:${subcontractor.contact_phone}`} className="text-primary">{subcontractor.contact_phone}</a></div>}
            {subcontractor.contact_email && <div className="flex justify-between"><span className="text-muted-foreground">E-post</span><a href={`mailto:${subcontractor.contact_email}`} className="text-primary truncate ml-2">{subcontractor.contact_email}</a></div>}
          </CardContent>
        </Card>
      </div>

      {(subcontractor.start_date || subcontractor.end_date) && (
        <Card><CardContent className="p-4 flex items-center gap-4 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Periode:</span>
          <span>{subcontractor.start_date && format(new Date(subcontractor.start_date), 'dd.MM.yyyy', { locale: nb })}{subcontractor.start_date && subcontractor.end_date && ' - '}{subcontractor.end_date && format(new Date(subcontractor.end_date), 'dd.MM.yyyy', { locale: nb })}</span>
        </CardContent></Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="evaluation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="evaluation"><ClipboardCheck className="h-4 w-4 mr-2" />Seriøsitetskontroll</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-2" />Dokumenter ({documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluation"><Ks2SubcontractorEvaluation subcontractorId={subcontractorId} /></TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Dokumenter</CardTitle>
              <Button size="sm" onClick={() => setShowUploadDialog(true)}><Upload className="h-4 w-4 mr-2" />Last opp</Button>
            </CardHeader>
            <CardContent>
              {docsLoading ? <p className="text-sm text-muted-foreground">Laster...</p> : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Ingen dokumenter</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowUploadDialog(true)}><Upload className="h-4 w-4 mr-2" />Last opp</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.document_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{documentTypeLabels[doc.document_type]}</Badge>
                            {doc.expiry_date && <span>Utløper: {format(new Date(doc.expiry_date), 'dd.MM.yyyy', { locale: nb })}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => downloadDocument(doc.file_path)}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Ks2SubcontractorDocumentUpload open={showUploadDialog} onOpenChange={setShowUploadDialog} subcontractorId={subcontractorId} />
    </div>
  );
}