import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";
import { EmploymentContract } from "@/hooks/useEmploymentContracts";
import { Loader2, ChevronLeft, ChevronRight, FileText, MapPin, Calendar, Clock, Umbrella, Wallet, LogOut, Building2, GraduationCap, Scale, StickyNote } from "lucide-react";
import { ExtendedContractFormData, defaultExtendedFormData } from "./ExtendedContractFormData";
import { BasicInfoSection } from "./form-sections/BasicInfoSection";
import { WorkplaceSection } from "./form-sections/WorkplaceSection";
import { DatesSection } from "./form-sections/DatesSection";
import { WorkingHoursSection } from "./form-sections/WorkingHoursSection";
import { VacationSection } from "./form-sections/VacationSection";
import { SalarySection } from "./form-sections/SalarySection";
import { NoticePeriodSection } from "./form-sections/NoticePeriodSection";
import { StaffingAgencySection } from "./form-sections/StaffingAgencySection";
import { BenefitsSection } from "./form-sections/BenefitsSection";
import { CollectiveAgreementSection } from "./form-sections/CollectiveAgreementSection";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ExtendedContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExtendedContractFormData) => void;
  isSubmitting?: boolean;
  editingContract?: EmploymentContract | null;
}

const sections = [
  { id: 'basic', label: 'Grunninfo', icon: FileText },
  { id: 'workplace', label: 'Arbeidssted', icon: MapPin },
  { id: 'dates', label: 'Oppstart', icon: Calendar },
  { id: 'hours', label: 'Arbeidstid', icon: Clock },
  { id: 'vacation', label: 'Ferie', icon: Umbrella },
  { id: 'salary', label: 'Lønn', icon: Wallet },
  { id: 'notice', label: 'Oppsigelse', icon: LogOut },
  { id: 'staffing', label: 'Innleie', icon: Building2 },
  { id: 'benefits', label: 'Goder', icon: GraduationCap },
  { id: 'collective', label: 'Tariff', icon: Scale },
  { id: 'notes', label: 'Notater', icon: StickyNote },
];

export function ExtendedContractDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  isSubmitting,
  editingContract,
}: ExtendedContractDialogProps) {
  const { employees, isLoading: loadingEmployees } = useEmployees();
  const { company } = useAuth();
  
  const getDefaultFormData = (): ExtendedContractFormData => ({
    ...defaultExtendedFormData,
    workplace_address: company?.address 
      ? `${company.address}, ${company.postal_code} ${company.city}`.trim()
      : '',
  });

  const [formData, setFormData] = useState<ExtendedContractFormData>(getDefaultFormData());
  const [activeTab, setActiveTab] = useState('basic');

  const isEditing = !!editingContract;

  // Populate form when editing
  useEffect(() => {
    if (editingContract && open) {
      const contractData: ExtendedContractFormData = {
        employee_id: editingContract.employee_id,
        contract_type: editingContract.contract_type,
        position: editingContract.position,
        work_description: editingContract.work_description || '',
        employment_percentage: editingContract.employment_percentage,
        start_date: editingContract.start_date,
        end_date: editingContract.end_date || '',
        probation_period_months: editingContract.probation_period_months || undefined,
        notes: editingContract.notes || '',
        workplace_address: editingContract.workplace_address || '',
        has_multiple_workplaces: editingContract.has_multiple_workplaces,
        remote_work_allowed: editingContract.remote_work_allowed,
        remote_work_details: editingContract.remote_work_details || '',
        working_hours_per_week: editingContract.working_hours_per_week,
        working_hours_per_day: editingContract.working_hours_per_day || undefined,
        work_time_arrangement: editingContract.work_time_arrangement || 'normal',
        break_duration_minutes: editingContract.break_duration_minutes,
        variable_working_hours: editingContract.variable_working_hours,
        variable_hours_description: editingContract.variable_hours_description || '',
        shift_change_rules: editingContract.shift_change_rules || '',
        temporary_reason: editingContract.temporary_reason || '',
        vacation_days: editingContract.vacation_days,
        holiday_pay_percentage: editingContract.holiday_pay_percentage,
        vacation_rules: editingContract.vacation_rules || '',
        salary_amount: editingContract.salary_amount || undefined,
        salary_type: editingContract.salary_type,
        payment_method: editingContract.payment_method,
        payment_day: editingContract.payment_day,
        overtime_compensation: editingContract.overtime_compensation || '',
        other_allowances: editingContract.other_allowances || '',
        notice_period_employee_months: editingContract.notice_period_employee_months,
        notice_period_employer_months: editingContract.notice_period_employer_months,
        termination_procedures: editingContract.termination_procedures || '',
        is_staffing_agency: editingContract.is_staffing_agency,
        client_company_name: editingContract.client_company_name || '',
        client_company_org_number: editingContract.client_company_org_number || '',
        training_provisions: editingContract.training_provisions || '',
        pension_scheme: editingContract.pension_scheme || '',
        insurance_provisions: editingContract.insurance_provisions || '',
        sick_pay_rules: editingContract.sick_pay_rules || '',
        has_collective_agreement: editingContract.has_collective_agreement,
        collective_agreement_name: editingContract.collective_agreement_name || '',
        collective_agreement_parties: editingContract.collective_agreement_parties || '',
        special_work_time_exemptions: editingContract.special_work_time_exemptions,
        special_work_time_details: editingContract.special_work_time_details || '',
      };
      setFormData(contractData);
    } else if (!editingContract && open) {
      setFormData(getDefaultFormData());
    }
  }, [editingContract, open]);

  const handleChange = (updates: Partial<ExtendedContractFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.position) {
      return;
    }
    
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData(getDefaultFormData());
    setActiveTab('basic');
    onOpenChange(false);
  };

  const currentIndex = sections.findIndex(s => s.id === activeTab);
  const canGoNext = currentIndex < sections.length - 1;
  const canGoPrev = currentIndex > 0;

  const goNext = () => {
    if (canGoNext) {
      setActiveTab(sections[currentIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (canGoPrev) {
      setActiveTab(sections[currentIndex - 1].id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>{isEditing ? 'Rediger arbeidsavtale' : 'Opprett arbeidsavtale'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Endringer vil kreve ny signering fra begge parter'
              : 'Komplett arbeidsavtale i henhold til arbeidsmiljøloven § 14-6'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            {/* Tab navigation - horizontal scroll on mobile */}
            <div className="border-b shrink-0 px-2">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex w-max gap-1 p-1 bg-transparent h-auto">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <TabsTrigger 
                        key={section.id} 
                        value={section.id}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap gap-1.5"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{section.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </ScrollArea>
            </div>

            {/* Content area */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6">
                <TabsContent value="basic" className="mt-0">
                  <BasicInfoSection 
                    formData={formData} 
                    onChange={handleChange}
                    employees={employees || []}
                    loadingEmployees={loadingEmployees}
                  />
                </TabsContent>

                <TabsContent value="workplace" className="mt-0">
                  <WorkplaceSection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="dates" className="mt-0">
                  <DatesSection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="hours" className="mt-0">
                  <WorkingHoursSection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="vacation" className="mt-0">
                  <VacationSection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="salary" className="mt-0">
                  <SalarySection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="notice" className="mt-0">
                  <NoticePeriodSection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="staffing" className="mt-0">
                  <StaffingAgencySection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="benefits" className="mt-0">
                  <BenefitsSection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="collective" className="mt-0">
                  <CollectiveAgreementSection formData={formData} onChange={handleChange} />
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2">Tilleggsopplysninger</h3>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notater</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => handleChange({ notes: e.target.value })}
                        placeholder="Eventuelle andre opplysninger som bør fremgå av avtalen..."
                        rows={6}
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          {/* Footer with navigation and submit */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t shrink-0 bg-muted/30">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={goPrev}
                disabled={!canGoPrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Forrige
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={goNext}
                disabled={!canGoNext}
              >
                Neste
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Avbryt
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.employee_id || !formData.position}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Lagre endringer' : 'Opprett avtale'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
