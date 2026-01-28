import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";
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
  isSubmitting 
}: ExtendedContractDialogProps) {
  const { employees, isLoading: loadingEmployees } = useEmployees();
  const { company } = useAuth();
  
  const [formData, setFormData] = useState<ExtendedContractFormData>({
    ...defaultExtendedFormData,
    workplace_address: company?.address 
      ? `${company.address}, ${company.postal_code} ${company.city}`.trim()
      : '',
  });
  const [activeTab, setActiveTab] = useState('basic');

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
    setFormData({
      ...defaultExtendedFormData,
      workplace_address: company?.address 
        ? `${company.address}, ${company.postal_code} ${company.city}`.trim()
        : '',
    });
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
          <DialogTitle>Opprett arbeidsavtale</DialogTitle>
          <DialogDescription>
            Komplett arbeidsavtale i henhold til arbeidsmiljøloven § 14-6
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
                Opprett avtale
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
