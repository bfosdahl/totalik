import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/t";

interface SimpleProjectDocumentsProps {
  projectId: string;
}

export function SimpleProjectDocuments({ projectId }: SimpleProjectDocumentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t("auto.dokumenter")}
        </CardTitle>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Last opp
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("auto.dokumenthaandtering_kommer_snart")}</p>
          <p className="text-sm text-muted-foreground">{t("auto.last_opp_tegninger_hms_plan_sha_plan_og_")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
