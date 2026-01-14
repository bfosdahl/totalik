import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IkMatActionItem, IkMatRisk } from "@/hooks/useIkMatContent";
import { AlertCircle, CheckCircle2, Clock, Filter, ExternalLink } from "lucide-react";

interface ActionPlanOverviewProps {
  actions: IkMatActionItem[];
  risks: IkMatRisk[];
  employees: Array<{ id: string; first_name?: string; last_name?: string }>;
  onUpdateAction: (id: string, field: keyof IkMatActionItem, value: any) => void;
  onOpenRisk: (riskId: string) => void;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';

export const ActionPlanOverview = ({
  actions,
  risks,
  employees,
  onUpdateAction,
  onOpenRisk,
}: ActionPlanOverviewProps) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');

  const today = new Date().toISOString().split('T')[0];

  // Enhance actions with overdue status
  const enhancedActions = useMemo(() => {
    return actions.map(action => ({
      ...action,
      isOverdue: action.status !== 'completed' && action.deadline && action.deadline < today,
      risk: risks.find(r => r.id === action.riskId),
      responsibleName: employees.find(e => e.id === action.responsible)
        ? `${employees.find(e => e.id === action.responsible)?.first_name} ${employees.find(e => e.id === action.responsible)?.last_name}`
        : 'Ikke tildelt',
    }));
  }, [actions, risks, employees, today]);

  // Filter actions
  const filteredActions = useMemo(() => {
    return enhancedActions
      .filter(a => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'overdue') return a.isOverdue;
        return a.status === filterStatus;
      })
      .filter(a => {
        if (filterResponsible === 'all') return true;
        return a.responsible === filterResponsible;
      })
      .sort((a, b) => {
        // Sort: overdue first, then by deadline
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;
      });
  }, [enhancedActions, filterStatus, filterResponsible]);

  // Stats
  const stats = useMemo(() => ({
    total: actions.length,
    pending: actions.filter(a => a.status === 'pending').length,
    inProgress: actions.filter(a => a.status === 'in_progress').length,
    completed: actions.filter(a => a.status === 'completed').length,
    overdue: enhancedActions.filter(a => a.isOverdue).length,
  }), [actions, enhancedActions]);

  const getStatusIcon = (action: typeof enhancedActions[0]) => {
    if (action.isOverdue) return <AlertCircle className="h-4 w-4 text-red-500" />;
    switch (action.status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'Ingen frist';
    return new Date(date).toLocaleDateString('nb-NO', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  if (actions.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardListIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-medium text-muted-foreground mb-2">
          Ingen tiltak i handlingsplanen
        </h3>
        <p className="text-sm text-muted-foreground">
          Tiltak opprettes fra risikovurderingene. Klikk på en risiko for å legge til tiltak.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Totalt</p>
          <p className="text-lg font-semibold">{stats.total}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Ikke startet</p>
          <p className="text-lg font-semibold">{stats.pending}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Pågår</p>
          <p className="text-lg font-semibold text-blue-600">{stats.inProgress}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Fullført</p>
          <p className="text-lg font-semibold text-green-600">{stats.completed}</p>
        </Card>
        <Card className={`p-3 ${stats.overdue > 0 ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''}`}>
          <p className="text-xs text-muted-foreground">Forfalt</p>
          <p className={`text-lg font-semibold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle status</SelectItem>
              <SelectItem value="overdue">Forfalt</SelectItem>
              <SelectItem value="pending">Ikke startet</SelectItem>
              <SelectItem value="in_progress">Pågår</SelectItem>
              <SelectItem value="completed">Fullført</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={filterResponsible} onValueChange={setFilterResponsible}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Ansvarlig" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle ansvarlige</SelectItem>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action list */}
      <div className="space-y-2">
        {filteredActions.map((action) => (
          <Card 
            key={action.id} 
            className={`${action.isOverdue ? 'border-red-300 dark:border-red-800' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getStatusIcon(action)}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{action.action || 'Ikke beskrevet'}</p>
                      {action.risk && (
                        <button 
                          onClick={() => action.riskId && onOpenRisk(action.riskId)}
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {action.risk.hazard}
                        </button>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`shrink-0 text-xs ${
                        action.actionType === 'preventive' 
                          ? 'border-blue-200 text-blue-700' 
                          : 'border-orange-200 text-orange-700'
                      }`}
                    >
                      {action.actionType === 'preventive' ? 'Forebyggende' : 'Korrigerende'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{action.responsibleName}</span>
                    <span>•</span>
                    <span className={action.isOverdue ? 'text-red-600 font-medium' : ''}>
                      {formatDate(action.deadline)}
                    </span>
                  </div>

                  {/* Quick status update */}
                  <div className="flex gap-1 pt-1">
                    {['pending', 'in_progress', 'completed'].map((status) => (
                      <Button
                        key={status}
                        variant={action.status === status ? 'default' : 'outline'}
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => onUpdateAction(action.id, 'status', status)}
                      >
                        {status === 'pending' && 'Ikke startet'}
                        {status === 'in_progress' && 'Pågår'}
                        {status === 'completed' && 'Fullført'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Ingen tiltak matcher filteret</p>
        </div>
      )}
    </div>
  );
};

// Simple icon component
const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);
