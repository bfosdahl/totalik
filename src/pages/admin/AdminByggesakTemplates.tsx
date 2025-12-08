import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Upload, 
  Plus, 
  Pencil, 
  Trash2,
  ExternalLink,
  Download
} from "lucide-react";
import { useByggesakTemplates, ByggesakTemplate } from "@/hooks/useKsModule2Byggesak";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  nabovarsel: "Nabovarsel",
  soknad: "Søknader",
  ansvarsrett: "Ansvarsrett",
  plan: "Planer",
  kontroll: "Kontroll",
  ferdigattest: "Ferdigattest",
  melding: "Meldinger",
  annet: "Annet",
};

export default function AdminByggesakTemplates() {
  const { data: templates, isLoading } = useByggesakTemplates();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<ByggesakTemplate | null>(null);

  const updateTemplate = useMutation({
    mutationFn: async (data: Partial<ByggesakTemplate> & { id: string }) => {
      const { id, ...update } = data;
      const { error } = await supabase
        .from("admin_byggesak_templates")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["byggesak-templates"] });
      toast.success("Mal oppdatert");
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere mal");
    },
  });

  const uploadPdf = async (templateId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${templateId}.${fileExt}`;
    const filePath = `templates/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("byggesak-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Kunne ikke laste opp fil");
      return;
    }

    await updateTemplate.mutateAsync({
      id: templateId,
      pdf_file_path: filePath,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Group by category
  const byCategory = (templates || []).reduce((acc, t) => {
    if (!acc[t.form_category]) acc[t.form_category] = [];
    acc[t.form_category].push(t);
    return acc;
  }, {} as Record<string, ByggesakTemplate[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Byggesak-maler</h1>
          <p className="text-muted-foreground">
            Administrer offisielle blanketter og skjemaer fra DIBK
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Legg til ny mal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lenker til offisielle skjemaer</CardTitle>
          <CardDescription>
            Last ned oppdaterte skjemaer fra Direktoratet for byggkvalitet (DIBK)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://dibk.no/byggeregler/skjema/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                DIBK Skjemaoversikt
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.altinn.no/skjemaoversikt/?FormsCategory=3754" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Altinn Byggesak
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.entries(byCategory).map(([category, categoryTemplates]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{CATEGORY_LABELS[category] || category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skjema</TableHead>
                  <TableHead>Navn</TableHead>
                  <TableHead>Versjon</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>Aktiv</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryTemplates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Badge variant="secondary">{template.form_number}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{template.form_name}</TableCell>
                    <TableCell>{template.version || "-"}</TableCell>
                    <TableCell>
                      {template.pdf_file_path ? (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Lastet opp
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Ingen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => 
                          updateTemplate.mutate({ id: template.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <label>
                          <Button variant="ghost" size="icon" asChild>
                            <span><Upload className="h-4 w-4" /></span>
                          </Button>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadPdf(template.id, file);
                            }}
                          />
                        </label>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger mal</DialogTitle>
            <DialogDescription>
              Oppdater informasjon om blanketten
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Skjemanummer</Label>
                <Input value={editingTemplate.form_number} disabled />
              </div>
              <div>
                <Label>Navn</Label>
                <Input 
                  value={editingTemplate.form_name}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    form_name: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Beskrivelse</Label>
                <Input 
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    description: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Versjon</Label>
                <Input 
                  value={editingTemplate.version || ""}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    version: e.target.value
                  })}
                  placeholder="f.eks. 2024, TEK17"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Avbryt
            </Button>
            <Button 
              onClick={() => editingTemplate && updateTemplate.mutate(editingTemplate)}
              disabled={updateTemplate.isPending}
            >
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
