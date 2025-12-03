import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Download, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KsModule2Checklist, useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { downloadChecklistTemplatePdf } from "@/utils/ksChecklistTemplatePdf";

interface PaperChecklistUploadProps {
  checklist: KsModule2Checklist;
  projectId: string;
  onClose: () => void;
}

export function PaperChecklistUpload({ checklist, projectId, onClose }: PaperChecklistUploadProps) {
  const { updateChecklist } = useKsModule2Checklists(projectId);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(checklist.paper_file_path);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${checklist.id}/paper-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ks-module2-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('ks-module2-documents')
        .getPublicUrl(fileName);

      setUploadedFile(urlData.publicUrl);

      // Update checklist with uploaded file
      await updateChecklist(checklist.id, {
        paper_uploaded: true,
        paper_file_path: urlData.publicUrl,
        status: "completed",
        completed_at: new Date().toISOString(),
        progress_percent: 100,
      });

      toast.success("Utfylt skjema lastet opp!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Kunne ikke laste opp filen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    downloadChecklistTemplatePdf({
      title: checklist.title,
      templateName: checklist.template_name,
      responsibleName: checklist.responsible_user_name || undefined,
      deadlineDate: checklist.deadline_date || undefined,
      items: checklist.checklist_items.map(item => ({
        id: item.id,
        text: item.text,
        type: item.type,
        required: item.required,
      })),
    });
    toast.success("PDF lastet ned");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Papirskjema - {checklist.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={checklist.paper_uploaded ? "default" : "secondary"}>
                  {checklist.paper_uploaded ? "Opplastet" : "Venter på opplasting"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Download template */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Download className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="font-medium">Last ned mal</h4>
                  <p className="text-sm text-muted-foreground">
                    Last ned PDF-malen for utskrift
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Last ned
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload section */}
          <Card className={uploadedFile ? "border-green-500/50 bg-green-500/5" : "border-primary/20"}>
            <CardContent className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                onChange={handleFileUpload}
                className="hidden"
              />

              {uploadedFile ? (
                <div className="flex items-center gap-3">
                  <Check className="h-8 w-8 text-green-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-700">Skjema lastet opp</h4>
                    <p className="text-sm text-muted-foreground">
                      Utfylt skjema er lagret
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(uploadedFile, '_blank')}
                    >
                      Vis
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      Erstatt
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center gap-3 py-6 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 text-primary" />
                  )}
                  <div className="text-center">
                    <h4 className="font-medium">
                      {uploading ? "Laster opp..." : "Last opp utfylt skjema"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      PDF, JPG eller PNG
                    </p>
                  </div>
                  <Button variant="outline" disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Velg fil
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button onClick={onClose}>
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
