import { useState, useEffect } from "react";
import { Boxes, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createSeedProjects } from "@/utils/ksModule2SeedProjects";
import { getModuleDefaultSettings } from "@/lib/moduleDefaults";

interface Module {
  id: string;
  type: string;
  name: string;
  description: string;
  isActive: boolean;
}

const MODULE_DEFINITIONS = [
  {
    type: "IK_HMS",
    name: "IK HMS",
    description: "Internkontroll for helse, miljø og sikkerhet",
  },
  {
    type: "IK_MAT",
    name: "IK MAT",
    description: "Internkontroll for matsikkerhet",
  },
  {
    type: "IK_ALKOHOL",
    name: "IK Alkohol",
    description: "Internkontroll for alkoholhåndtering",
  },
  {
    type: "IK_BYGG",
    name: "KS Bygg",
    description: "Kvalitetssikring for byggprosjekter",
  },
  {
    type: "IK_FDV",
    name: "IK FDV",
    description: "Forvaltning, drift og vedlikehold av bygg",
  },
  {
    type: "PERSONALHANDBOK",
    name: "Personalhåndbok",
    description: "Digital personalhåndbok for ansatte",
  },
  {
    type: "GDPR",
    name: "GDPR",
    description: "EUs personvernforordning - dokumentasjon og sjekklister",
  },
  {
    type: "APENHETSLOVEN",
    name: "Åpenhetsloven",
    description: "Aktsomhetsvurderinger og redegjørelse for menneskerettigheter",
  },
];

interface CompanyModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
  } | null;
}

export function CompanyModulesDialog({
  open,
  onOpenChange,
  company,
}: CompanyModulesDialogProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!company || !open) return;

    const fetchModules = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("company_modules")
          .select("*")
          .eq("company_id", company.id)
          .eq("is_deleted", false);

        if (error) throw error;

        // Map existing modules to our structure
        const existingModules = data || [];
        const mappedModules = MODULE_DEFINITIONS.map((def) => {
          const existing = existingModules.find(
            (m) => m.module_type === def.type
          );
          return {
            id: existing?.id || "",
            type: def.type,
            name: def.name,
            description: def.description,
            isActive: existing?.is_active ?? false,
          };
        });

        setModules(mappedModules);
      } catch (error) {
        console.error("Error fetching modules:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke hente moduler",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, open]);

  const toggleModule = (moduleType: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.type === moduleType ? { ...m, isActive: !m.isActive } : m
      )
    );
  };

  const handleSave = async () => {
    if (!company) return;

    setIsSaving(true);
    try {
      for (const module of modules) {
        const wasInactive = !module.id; // Module didn't exist before
        const isBeingActivated = module.isActive && wasInactive;

        if (module.id) {
          // Update existing module
          const { error } = await supabase
            .from("company_modules")
            .update({ is_active: module.isActive })
            .eq("id", module.id);

          if (error) throw error;
        } else if (module.isActive) {
          // Create new module only if it's being activated
          // Use safe default settings to prevent crashes before AI setup runs
          const { error } = await supabase.from("company_modules").insert({
            company_id: company.id,
            module_type: module.type,
            is_active: true,
            settings: getModuleDefaultSettings(module.type),
          });

          if (error) throw error;

          // If KS Bygg module is being activated for the first time, create seed projects
          if (module.type === "IK_BYGG" && isBeingActivated) {
            await createSeedProjects(company.id);
          }
        }
      }

      toast({
        title: "Moduler oppdatert",
        description: `Moduler for ${company.name} er oppdatert`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving modules:", error);
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke lagre moduler",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = modules.filter((m) => m.isActive).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            Administrer moduler
          </DialogTitle>
        </DialogHeader>

        {company && (
          <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="p-2.5 sm:p-3 bg-secondary/30 rounded-lg flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Bedrift</p>
                <p className="font-medium text-sm sm:text-base truncate">{company.name}</p>
              </div>
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                {activeCount} aktive
              </Badge>
            </div>

            {isLoading ? (
              <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                Laster moduler...
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {modules.map((module) => (
                  <div
                    key={module.type}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-colors gap-3 ${
                      module.isActive
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-secondary/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div
                        className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                          module.isActive
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {module.isActive ? (
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Label className="font-medium cursor-pointer text-sm sm:text-base block">
                          {module.name}
                        </Label>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={module.isActive}
                      onCheckedChange={() => toggleModule(module.type)}
                      className="shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                size="sm"
                className="text-sm"
              >
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isSaving} size="sm" className="text-sm">
                {isSaving ? "Lagrer..." : "Lagre endringer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
