import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEmployees } from "@/hooks/useEmployees";
import { ContractFormData } from "@/hooks/useEmploymentContracts";
import { Loader2 } from "lucide-react";

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContractFormData) => void;
  isSubmitting?: boolean;
}

const contractTypes = [
  { value: 'permanent', label: 'Fast ansettelse' },
  { value: 'temporary', label: 'Midlertidig ansettelse' },
  { value: 'project', label: 'Prosjektansettelse' },
  { value: 'probation', label: 'Prøvetidsavtale' },
  { value: 'apprentice', label: 'Lærlingkontrakt' },
  { value: 'internship', label: 'Praksisplass' },
];

export function CreateContractDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  isSubmitting 
}: CreateContractDialogProps) {
  const { employees, isLoading: loadingEmployees } = useEmployees();
  
  const [formData, setFormData] = useState<ContractFormData>({
    employee_id: '',
    contract_type: 'permanent',
    position: '',
    employment_percentage: 100,
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    probation_period_months: 6,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id) {
      return;
    }
    
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      employee_id: '',
      contract_type: 'permanent',
      position: '',
      employment_percentage: 100,
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      probation_period_months: 6,
      notes: '',
    });
    onOpenChange(false);
  };

  const requiresEndDate = ['temporary', 'project', 'internship'].includes(formData.contract_type);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opprett ny ansettelsesavtale</DialogTitle>
          <DialogDescription>
            Fyll ut informasjon for den nye avtalen. Den vil bli sendt til elektronisk signering.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employee">Ansatt *</Label>
            <Select
              value={formData.employee_id}
              onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingEmployees ? "Laster..." : "Velg ansatt"} />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contract Type */}
          <div className="space-y-2">
            <Label htmlFor="contract_type">Avtale type *</Label>
            <Select
              value={formData.contract_type}
              onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Stilling *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="F.eks. Prosjektleder, Tømrer, etc."
              required
            />
          </div>

          {/* Employment Percentage */}
          <div className="space-y-2">
            <Label htmlFor="employment_percentage">Stillingsprosent *</Label>
            <Input
              id="employment_percentage"
              type="number"
              min={1}
              max={100}
              value={formData.employment_percentage}
              onChange={(e) => setFormData({ ...formData, employment_percentage: parseInt(e.target.value) || 100 })}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdato *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">
                Sluttdato {requiresEndDate ? '*' : '(valgfritt)'}
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                required={requiresEndDate}
              />
            </div>
          </div>

          {/* Probation Period */}
          <div className="space-y-2">
            <Label htmlFor="probation_period">Prøvetid (måneder)</Label>
            <Select
              value={formData.probation_period_months?.toString() || '0'}
              onValueChange={(value) => setFormData({ ...formData, probation_period_months: parseInt(value) || null })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Ingen prøvetid</SelectItem>
                <SelectItem value="3">3 måneder</SelectItem>
                <SelectItem value="6">6 måneder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Eventuelle tilleggsopplysninger..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.employee_id}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opprett avtale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
