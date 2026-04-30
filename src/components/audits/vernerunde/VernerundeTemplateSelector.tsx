import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Building2, 
  HardHat, 
  CheckCircle,
  Loader2,
  FileText,
  FilePlus2,
} from "lucide-react";
import { motion } from "framer-motion";
import { HmsVernerundeTemplate } from "@/hooks/useHmsVernerundeTemplates";

interface VernerundeTemplateSelectorProps {
  templates: HmsVernerundeTemplate[];
  isLoading: boolean;
  onSelectTemplate: (template: HmsVernerundeTemplate) => void;
  onCreateBlank?: () => void;
}

const getTemplateIcon = (templateName: string) => {
  if (templateName.toLowerCase().includes("byggeplass") || templateName.toLowerCase().includes("sha")) {
    return <HardHat className="w-6 h-6" />;
  }
  if (templateName.toLowerCase().includes("kartlegging")) {
    return <FileText className="w-6 h-6" />;
  }
  if (templateName.toLowerCase().includes("enkel")) {
    return <CheckCircle className="w-6 h-6" />;
  }
  return <ClipboardList className="w-6 h-6" />;
};

const getTemplateColor = (templateName: string) => {
  if (templateName.toLowerCase().includes("byggeplass") || templateName.toLowerCase().includes("sha")) {
    return "bg-orange-500/10 text-orange-500";
  }
  if (templateName.toLowerCase().includes("kartlegging")) {
    return "bg-blue-500/10 text-blue-500";
  }
  if (templateName.toLowerCase().includes("enkel")) {
    return "bg-green-500/10 text-green-500";
  }
  return "bg-primary/10 text-primary";
};

const VernerundeTemplateSelector = ({
  templates,
  isLoading,
  onSelectTemplate,
  onCreateBlank,
}: VernerundeTemplateSelectorProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Velg type vernerunde</h3>
        <p className="text-sm text-muted-foreground">
          Velg en ferdig sjekkliste, eller opprett en tom vernerunde med egne punkter
        </p>
      </div>

      {onCreateBlank && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group border-dashed border-2"
            onClick={onCreateBlank}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <FilePlus2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium group-hover:text-primary transition-colors">
                    Opprett tom vernerunde
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Lag din egen sjekkliste – legg til kategorier og punkter selv
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getTemplateColor(template.template_name)}`}>
                    {getTemplateIcon(template.template_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                        {template.template_name}
                      </h4>
                      {template.is_system_template && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Standard
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description || "Ingen beskrivelse"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {template.checkpoints.length} sjekkpunkter
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {[...new Set(template.checkpoints.map(c => c.category))].length} kategorier
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VernerundeTemplateSelector;
