import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/t";

interface SimpleProjectFinancesProps {
  projectId: string;
}

export function SimpleProjectFinances({ projectId }: SimpleProjectFinancesProps) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">{t("auto.inntekter")}</span>
            </div>
            <p className="text-2xl font-bold">{t("auto.kr_0")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium">{t("auto.utgifter")}</span>
            </div>
            <p className="text-2xl font-bold">{t("auto.kr_0")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5" />
              <span className="text-sm font-medium">{t("auto.balanse")}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{t("auto.kr_0")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transaksjoner
          </CardTitle>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t("auto.ny_registrering")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("auto.oekonomi_kommer_snart")}</p>
            <p className="text-sm text-muted-foreground">{t("auto.registrer_inntekter_og_utgifter_for_pros")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
