import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  UserCheck,
  UserX,
  QrCode,
  RefreshCw,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKsModule2Subcontractors, KsModule2Subcontractor } from "@/hooks/useKsModule2Subcontractors";
import { useKsModule2ProjectAccess, KsModule2ProjectAccess } from "@/hooks/useKsModule2ProjectAccess";
import { NewSubcontractorDialog } from "@/components/ks2/NewSubcontractorDialog";
import { Ks2AccessQrCodeDialog } from "@/components/ks2/Ks2AccessQrCodeDialog";
import { Ks2AccessLogDialog } from "@/components/ks2/Ks2AccessLogDialog";
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
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Venter", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Godkjent", color: "bg-green-100 text-green-800", icon: CheckCircle },
  approved_with_remarks: { label: "Godkjent m/merknader", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  rejected: { label: "Avvist", color: "bg-red-100 text-red-800", icon: XCircle },
};

const accessStatusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  invited: { label: "Invitert", color: "bg-blue-100 text-blue-800", icon: Mail },
  active: { label: "Aktiv", color: "bg-green-100 text-green-800", icon: UserCheck },
  expired: { label: "Utløpt", color: "bg-orange-100 text-orange-800", icon: Clock },
  revoked: { label: "Fjernet", color: "bg-red-100 text-red-800", icon: UserX },
};

export default function Ks2Underleverandorer() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<KsModule2ProjectAccess | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [accessToRevoke, setAccessToRevoke] = useState<string | null>(null);

  const { subcontractors, isLoading } = useKsModule2Subcontractors(projectId || null);
  const { accessList, revokeAccess, renewAccess, isLoading: accessLoading } = useKsModule2ProjectAccess(projectId || null);

  const filteredSubcontractors = subcontractors.filter(sub =>
    sub.firm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.work_scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.trade && sub.trade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAccess = accessList.filter(acc =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (acc.company_name && acc.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubcontractorClick = (subcontractor: KsModule2Subcontractor) => {
    navigate(`/ks2/project/${projectId}/underleverandorer/${subcontractor.id}`);
  };

  const handleRevokeAccess = async () => {
    if (accessToRevoke) {
      await revokeAccess.mutateAsync(accessToRevoke);
      setShowRevokeDialog(false);
      setAccessToRevoke(null);
    }
  };

  const handleRenewAccess = async (id: string) => {
    // Renew for 1 year from now
    const newExpiry = new Date();
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    await renewAccess.mutateAsync({ 
      id, 
      newExpiryDate: newExpiry.toISOString() 
    });
  };

  const activeAccessCount = accessList.filter(a => a.status === 'active' || a.status === 'invited').length;
  const expiredAccessCount = accessList.filter(a => a.status === 'expired').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Underleverandører</h2>
          <p className="text-sm text-muted-foreground">Registrer og følg opp UE med gjestetilgang</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLogDialog(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Tilgangslogg
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowQrDialog(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            QR-kode
          </Button>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ny underleverandør
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter firma, fagområde, e-post..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{subcontractors.length}</div><div className="text-sm text-muted-foreground">Totalt UE</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{subcontractors.filter(s => s.approval_status === 'approved').length}</div><div className="text-sm text-muted-foreground">Godkjent</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{subcontractors.filter(s => s.approval_status === 'pending').length}</div><div className="text-sm text-muted-foreground">Venter</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-primary">{activeAccessCount}</div><div className="text-sm text-muted-foreground">Med tilgang</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-orange-600">{expiredAccessCount}</div><div className="text-sm text-muted-foreground">Utløpt tilgang</div></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subcontractors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subcontractors">Underleverandører ({subcontractors.length})</TabsTrigger>
          <TabsTrigger value="access">Gjestetilgang ({accessList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="subcontractors">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Laster...</p>
          ) : filteredSubcontractors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen underleverandører</h3>
                <p className="text-muted-foreground mb-4">Registrer underleverandører for å følge opp.</p>
                <Button onClick={() => setShowNewDialog(true)}><Plus className="h-4 w-4 mr-2" />Registrer</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSubcontractors.map((sub) => {
                const status = statusConfig[sub.approval_status];
                const StatusIcon = status.icon;
                const hasAccess = accessList.some(a => a.subcontractor_id === sub.id && (a.status === 'active' || a.status === 'invited'));
                
                return (
                  <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSubcontractorClick(sub)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium truncate">{sub.firm_name}</h3>
                            <Badge className={status.color}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge>
                            {hasAccess && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Har tilgang
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{sub.work_scope}{sub.trade && ` • ${sub.trade}`}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {sub.org_number && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{sub.org_number}</span>}
                            {sub.contact_phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{sub.contact_phone}</span>}
                            {sub.contact_email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{sub.contact_email}</span>}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="access">
          {accessLoading ? (
            <p className="text-center py-8 text-muted-foreground">Laster...</p>
          ) : filteredAccess.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen gjestetilganger</h3>
                <p className="text-muted-foreground mb-4">Gi underleverandører tilgang når du registrerer dem.</p>
                <Button onClick={() => setShowNewDialog(true)}><Plus className="h-4 w-4 mr-2" />Registrer UE med tilgang</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAccess.map((access) => {
                const accessStatus = accessStatusConfig[access.status];
                const AccessStatusIcon = accessStatus.icon;
                const hasLoggedIn = access.login_count > 0;
                
                return (
                  <Card key={access.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium truncate">{access.name}</h3>
                            <Badge className={accessStatus.color}>
                              <AccessStatusIcon className="h-3 w-3 mr-1" />
                              {accessStatus.label}
                            </Badge>
                            {hasLoggedIn && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Har logget inn
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {access.access_level === 'full_ue' ? 'Full UE' : 'Gjest'}
                            </Badge>
                          </div>
                          {access.company_name && (
                            <p className="text-sm text-muted-foreground mb-1">{access.company_name}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {access.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3.5 w-3.5" />
                              {access.role_in_project}
                            </span>
                            {access.expires_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Utløper: {format(new Date(access.expires_at), "d. MMM yyyy", { locale: nb })}
                              </span>
                            )}
                            {access.last_login && (
                              <span className="flex items-center gap-1 text-green-600">
                                <UserCheck className="h-3.5 w-3.5" />
                                Sist innlogget: {format(new Date(access.last_login), "d. MMM yyyy HH:mm", { locale: nb })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(access.status === 'expired' || access.status === 'revoked') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenewAccess(access.id);
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Forny
                            </Button>
                          )}
                          {(access.status === 'active' || access.status === 'invited') && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAccessToRevoke(access.id);
                                setShowRevokeDialog(true);
                              }}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Fjern
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewSubcontractorDialog open={showNewDialog} onOpenChange={setShowNewDialog} projectId={projectId || ""} />
      
      <Ks2AccessQrCodeDialog 
        open={showQrDialog} 
        onOpenChange={setShowQrDialog} 
        projectId={projectId || ""} 
      />
      
      <Ks2AccessLogDialog 
        open={showLogDialog} 
        onOpenChange={setShowLogDialog} 
        projectId={projectId || ""} 
      />

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern tilgang?</AlertDialogTitle>
            <AlertDialogDescription>
              Brukeren vil ikke lenger kunne logge inn på dette prosjektet. Du kan fornye tilgangen senere om nødvendig.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAccess} className="bg-destructive text-destructive-foreground">
              Fjern tilgang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
