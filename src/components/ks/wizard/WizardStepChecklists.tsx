import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { WizardData } from "../ProjectWizard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface WizardStepChecklistsProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
}

const checklistCategories = [
  {
    category: "Generelle sjekklister",
    checklists: [
      { id: "forhandsbefaring", label: "Forhåndsbefaring" },
      { id: "ferdigbefaring", label: "Ferdigbefaring" },
      { id: "sluttbefaring", label: "Sluttbefaring" },
      { id: "overtakelsesbefaring", label: "Overtakelsesbefaring" },
      { id: "1_ars_garanti", label: "1-års garantibefaring" },
    ]
  },
  {
    category: "Faglige sjekklister",
    checklists: [
      { id: "tomrerarbeid", label: "Tømrerarbeid" },
      { id: "vatrom_membran", label: "Våtrom før membran" },
      { id: "ror_lukking", label: "Rør før lukking" },
      { id: "elektro_trekking", label: "Elektro før trekking" },
      { id: "luft_dampsperre", label: "Luft-/dampsperre" },
      { id: "brannsikring", label: "Brannsikring" },
      { id: "tekking_tak", label: "Tekking / tak" },
      { id: "betong_armering", label: "Betong / armering" },
      { id: "isolasjon", label: "Isolasjon" },
    ]
  },
  {
    category: "Kontroll & kvalitet",
    checklists: [
      { id: "kontroll_lukking", label: "Kontroll før lukking" },
      { id: "ue_evaluering", label: "UE-evaluering" },
      { id: "kvalitet_fagarbeid", label: "Sjekkliste kvalitet fagarbeid" },
    ]
  },
];

export function WizardStepChecklists({ data, updateData }: WizardStepChecklistsProps) {
  const handleToggleChecklist = (checklistId: string) => {
    const current = data.valgte_sjekklister || [];
    const updated = current.includes(checklistId)
      ? current.filter(c => c !== checklistId)
      : [...current, checklistId];
    updateData({ valgte_sjekklister: updated });
  };

  const handleToggleCategory = (categoryChecklists: { id: string; label: string }[]) => {
    const current = data.valgte_sjekklister || [];
    const categoryIds = categoryChecklists.map(c => c.id);
    const allSelected = categoryIds.every(id => current.includes(id));
    
    if (allSelected) {
      // Remove all from category
      updateData({ valgte_sjekklister: current.filter(id => !categoryIds.includes(id)) });
    } else {
      // Add all from category
      const newIds = categoryIds.filter(id => !current.includes(id));
      updateData({ valgte_sjekklister: [...current, ...newIds] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Velg sjekklister for prosjektet</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Sjekklistene vil være tilgjengelige i prosjektet for utfylling og oppfølging
        </p>

        <Accordion type="multiple" className="w-full">
          {checklistCategories.map((cat, idx) => {
            const categoryIds = cat.checklists.map(c => c.id);
            const selectedCount = categoryIds.filter(id => 
              (data.valgte_sjekklister || []).includes(id)
            ).length;
            const allSelected = selectedCount === categoryIds.length;

            return (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-xs text-muted-foreground">
                      {selectedCount}/{categoryIds.length} valgt
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id={`category-${idx}`}
                        checked={allSelected}
                        onCheckedChange={() => handleToggleCategory(cat.checklists)}
                      />
                      <Label
                        htmlFor={`category-${idx}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        Velg alle
                      </Label>
                    </div>
                    {cat.checklists.map((checklist) => (
                      <div key={checklist.id} className="flex items-center space-x-2 pl-4">
                        <Checkbox
                          id={checklist.id}
                          checked={(data.valgte_sjekklister || []).includes(checklist.id)}
                          onCheckedChange={() => handleToggleChecklist(checklist.id)}
                        />
                        <Label
                          htmlFor={checklist.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {checklist.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <div className="bg-muted/30 p-4 rounded-md">
        <p className="text-sm text-muted-foreground">
          <strong>Tips:</strong> Wizard kan foreslå sjekklister basert på tiltakstype og byggetype du valgte tidligere.
          Du kan alltid legge til flere sjekklister senere i prosjektet.
        </p>
      </div>
    </div>
  );
}
