import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  FileCheck, 
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useKsModule2Subcontractors, KsModule2Subcontractor } from "@/hooks/useKsModule2Subcontractors";
import { NewSubcontractorDialog } from "@/components/ks2/NewSubcontractorDialog";

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Venter", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Godkjent", color: "bg-green-100 text-green-800", icon: CheckCircle },
  approved_with_remarks: { label: "Godkjent m/merknader", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  rejected: { label: "Avvist", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function Ks2Underleverandorer() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { subcontractors, isLoading } = useKsModule2Subcontractors(projectId || null);

  const filteredSubcontractors = subcontractors.filter(sub =>
    sub.firm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.work_scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.trade && sub.trade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubcontractorClick = (subcontractor: KsModule2Subcontractor) => {
    navigate(`/ks2/project/${projectId}/underleverandorer/${subcontractor.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Underleverandører</h2>
          <p className="text-sm text-muted-foreground">Registrer og følg opp UE</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny underleverandør
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter firma, fagområde..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{subcontractors.length}</div><div className="text-sm text-muted-foreground">Totalt</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{subcontractors.filter(s => s.approval_status === 'approved').length}</div><div className="text-sm text-muted-foreground">Godkjent</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{subcontractors.filter(s => s.approval_status === 'pending').length}</div><div className="text-sm text-muted-foreground">Venter</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-red-600">{subcontractors.filter(s => s.approval_status === 'rejected').length}</div><div className="text-sm text-muted-foreground">Avvist</div></CardContent></Card>
      </div>

      {/* List */}
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
            return (
              <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSubcontractorClick(sub)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{sub.firm_name}</h3>
                        <Badge className={status.color}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge>
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

      <NewSubcontractorDialog open={showNewDialog} onOpenChange={setShowNewDialog} projectId={projectId || ""} />
    </div>
  );
}
