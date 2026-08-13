import { Scale, ExternalLink, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { t } from "@/i18n/t";

const regulations = [
  {
    category: "Arbeidsmiljø",
    items: [
      {
        name: "Arbeidsmiljøloven",
        description: t("auto.lov_om_arbeidsmiljoe_arbeidstid_og_still_2"),
        link: "https://lovdata.no/dokument/NL/lov/2005-06-17-62",
        relevance: "Krav til forsvarlig arbeidsmiljø i bygninger",
      },
      {
        name: "Internkontrollforskriften",
        description: t("auto.forskrift_om_systematisk_helse_miljoe_og"),
        link: "https://lovdata.no/dokument/SF/forskrift/1996-12-06-1127",
        relevance: "Krav til systematisk HMS-arbeid, inkludert bygningsrelaterte forhold",
      },
    ],
  },
  {
    category: "Brann og sikkerhet",
    items: [
      {
        name: t("auto.brann_og_eksplosjonsvernloven"),
        description: t("auto.lov_om_vern_mot_brann_eksplosjon_og_ulyk"),
        link: "https://lovdata.no/dokument/NL/lov/2002-06-14-20",
        relevance: "Overordnet lov for brannvern i bygninger",
      },
      {
        name: "Forskrift om brannforebygging",
        description: t("auto.forskrift_om_brannforebygging"),
        link: "https://lovdata.no/dokument/SF/forskrift/2015-12-17-1710",
        relevance: "Spesifikke krav til brannforebygging, kontroller og dokumentasjon",
      },
    ],
  },
  {
    category: "Elektriske anlegg",
    items: [
      {
        name: "El-tilsynsloven",
        description: t("auto.lov_om_tilsyn_med_elektriske_anlegg_og_e"),
        link: "https://lovdata.no/dokument/NL/lov/1929-05-24-4",
        relevance: "Krav til elektriske installasjoner og kontroller",
      },
      {
        name: "Forskrift om elektriske lavspenningsanlegg (FEL)",
        description: t("auto.krav_til_prosjektering_utfoerelse_og_ved"),
        link: "https://lovdata.no/dokument/SF/forskrift/1998-11-06-1060",
        relevance: "Spesifikke krav til el-kontroll og dokumentasjon",
      },
    ],
  },
  {
    category: "Bygg og planlegging",
    items: [
      {
        name: "Plan- og bygningsloven",
        description: t("auto.lov_om_planlegging_og_byggesaksbehandlin"),
        link: "https://lovdata.no/dokument/NL/lov/2008-06-27-71",
        relevance: "Overordnede krav til bygg og endringer",
      },
      {
        name: "TEK17 (Byggteknisk forskrift)",
        description: t("auto.forskrift_om_tekniske_krav_til_byggverk"),
        link: "https://lovdata.no/dokument/SF/forskrift/2017-06-19-840",
        relevance: "Tekniske krav ved bygging og endring av byggverk",
      },
    ],
  },
  {
    category: "Inneklima og ventilasjon",
    items: [
      {
        name: t("auto.forskrift_om_miljoerettet_helsevern"),
        description: t("auto.krav_til_inneklima_i_offentlige_bygg_og_"),
        link: "https://lovdata.no/dokument/SF/forskrift/2003-04-25-486",
        relevance: "Krav til luftkvalitet, temperatur og ventilasjon",
      },
    ],
  },
];

export default function FdvRegulations() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-7 w-7 text-primary" />
            Lov- og forskriftsoversikt
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("auto.relevant_regelverk_for_forvaltning_drift")}
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-1">{t("auto.om_denne_oversikten")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("auto.denne_siden_gir_en_oversikt_over_de_vikt")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regulations */}
        <div className="space-y-6">
          {regulations.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.items.map((item) => (
                  <div key={item.name} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {item.relevance}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Lovdata
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>{t("auto.ansvarsfraskrivelse")}</strong> {t("auto.denne_oversikten_er_kun_ment_som_en_veil")}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
