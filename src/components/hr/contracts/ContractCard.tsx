import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmploymentContract } from "@/hooks/useEmploymentContracts";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MoreHorizontal, Pen, Eye, Trash2, Check, Clock, FileText } from "lucide-react";

interface ContractCardProps {
  contract: EmploymentContract;
  onView: (contract: EmploymentContract) => void;
  onSignAsEmployer: (contract: EmploymentContract) => void;
  onDelete: (contract: EmploymentContract) => void;
  canManage: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Utkast', variant: 'secondary' },
  pending_signature: { label: 'Venter signatur', variant: 'outline' },
  active: { label: 'Aktiv', variant: 'default' },
  expired: { label: 'Utløpt', variant: 'destructive' },
  terminated: { label: 'Avsluttet', variant: 'destructive' },
};

const contractTypeLabels: Record<string, string> = {
  permanent: 'Fast',
  temporary: 'Midlertidig',
  project: 'Prosjekt',
  probation: 'Prøvetid',
  apprentice: 'Lærling',
  internship: 'Praksis',
};

export function ContractCard({ 
  contract, 
  onView, 
  onSignAsEmployer,
  onDelete,
  canManage 
}: ContractCardProps) {
  const employeeName = contract.employee 
    ? `${contract.employee.first_name || ''} ${contract.employee.last_name || ''}`.trim()
    : 'Ukjent ansatt';

  const status = statusConfig[contract.status] || statusConfig.draft;
  const contractType = contractTypeLabels[contract.contract_type] || contract.contract_type;

  const needsEmployerSignature = !contract.signed_by_employer && canManage;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <h3 className="font-semibold truncate">{employeeName}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{contract.position}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="outline">{contractType}</Badge>
            <Badge variant="outline">{contract.employment_percentage}%</Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Start: {format(new Date(contract.start_date), 'd. MMM yyyy', { locale: nb })}
            </span>
            {contract.end_date && (
              <span>
                Slutt: {format(new Date(contract.end_date), 'd. MMM yyyy', { locale: nb })}
              </span>
            )}
          </div>

          {/* Signature status */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t text-xs">
            <div className="flex items-center gap-1">
              {contract.signed_by_employer ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <Clock className="w-3 h-3 text-muted-foreground" />
              )}
              <span>Arbeidsgiver</span>
            </div>
            <div className="flex items-center gap-1">
              {contract.signed_by_employee ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <Clock className="w-3 h-3 text-muted-foreground" />
              )}
              <span>Arbeidstaker</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {needsEmployerSignature && (
            <Button 
              size="sm" 
              onClick={() => onSignAsEmployer(contract)}
              className="gap-1"
            >
              <Pen className="w-3 h-3" />
              Signer
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(contract)}>
                <Eye className="w-4 h-4 mr-2" />
                Se detaljer
              </DropdownMenuItem>
              {canManage && !contract.signed_by_employer && (
                <DropdownMenuItem onClick={() => onSignAsEmployer(contract)}>
                  <Pen className="w-4 h-4 mr-2" />
                  Signer som arbeidsgiver
                </DropdownMenuItem>
              )}
              {canManage && contract.status === 'draft' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(contract)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
