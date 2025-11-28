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
    type: "KS_BYGG",
    name: "KS Bygg",
    description: "Kvalitetssikring for byggprosjekter",
  },
  {
    type: "PERSONALHANDBOK",
    name: "Personalhåndbok",
    description: "Digital personalhåndbok for ansatte",
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
          .eq("company_id", company.id);

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
  }, [company, open, toast]);

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
        if (module.id) {
          // Update existing module
          const { error } = await supabase
            .from("company_modules")
            .update({ is_active: module.isActive })
            .eq("id", module.id);

          if (error) throw error;
        } else if (module.isActive) {
          // Create new module only if it's being activated
          const { error } = await supabase.from("company_modules").insert({
            company_id: company.id,
            module_type: module.type,
            is_active: true,
          });

          if (error) throw error;
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="w-5 h-5" />
            Administrer moduler
          </DialogTitle>
        </DialogHeader>

        {company && (
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bedrift</p>
                <p className="font-medium">{company.name}</p>
              </div>
              <Badge variant="secondary">
                {activeCount} aktive moduler
              </Badge>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Laster moduler...
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((module) => (
                  <div
                    key={module.type}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      module.isActive
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-secondary/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          module.isActive
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {module.isActive ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <Label className="font-medium cursor-pointer">
                          {module.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={module.isActive}
                      onCheckedChange={() => toggleModule(module.type)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Lagrer..." : "Lagre endringer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
