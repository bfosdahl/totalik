import { ExternalLink, BookOpen, Scale, GraduationCap, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleDokumentsenter } from "@/components/documents/ModuleDokumentsenter";
import { t } from "@/i18n/t";

function IkAlkoholResources() {
  return (
    <div className="space-y-6">
      {/* Lovverk */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Scale className="h-5 w-5 text-amber-600" />
          Lovverk og forskrifter
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: t("auto.alkoholloven"), desc: "Lov om omsetning av alkoholholdig drikk m.v.", url: "https://lovdata.no/dokument/NL/lov/1989-06-02-27" },
            { title: t("auto.alkoholforskriften"), desc: "Forskrift om omsetning av alkoholholdig drikk mv.", url: "https://lovdata.no/dokument/SF/forskrift/2005-06-08-538" },
            { title: t("auto.serveringsloven"), desc: "Lov om serveringsvirksomhet", url: "https://lovdata.no/dokument/NL/lov/1997-06-13-55" },
            { title: t("auto.internkontrollforskriften"), desc: "Forskrift om systematisk helse-, miljø- og sikkerhetsarbeid", url: "https://lovdata.no/dokument/SF/forskrift/1996-12-06-1127" },
          ].map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
                    <Scale className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1">
                      {item.title}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Veiledninger */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Veiledninger og retningslinjer
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: t("auto.helsedirektoratets_veileder"), desc: "Veileder til alkoholloven og tilhørende forskrifter", url: "https://www.helsedirektoratet.no/veiledere/alkoholloven" },
            { title: t("auto.kommunens_ansvar"), desc: "Om kommunens kontroll med salgs- og skjenkebevillinger", url: "https://www.helsedirektoratet.no/veiledere/alkoholloven" },
            { title: t("auto.ansvarlig_vertskap"), desc: "Kurs og opplæring for ansatte i serveringsbransjen", url: "https://www.helsedirektoratet.no/tema/alkohol" },
            { title: t("auto.akan_arbeidslivets_kompetansesenter"), desc: "Forebygging av rus og avhengighet i arbeidslivet", url: "https://akan.no" },
          ].map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0 mt-0.5">
                    <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                      {item.title}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Opplæring */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <GraduationCap className="h-5 w-5 text-emerald-600" />
          {t("auto.opplaering_og_kunnskapsproeve")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: t("auto.kunnskapsproeven"), desc: "Informasjon om kunnskapsprøve i alkoholloven", url: "https://www.helsedirektoratet.no/tema/alkohol/kunnskapsproven" },
            { title: t("auto.etablererproeven"), desc: "Prøve for serveringsbevillinger", url: "https://www.mattilsynet.no" },
          ].map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 shrink-0 mt-0.5">
                    <GraduationCap className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                      {item.title}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tilsyn */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-purple-600" />
          Tilsyn og kontroll
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: t("auto.prikksystemet"), desc: "Informasjon om prikktildeling ved brudd på alkoholloven", url: "https://www.helsedirektoratet.no/veiledere/alkoholloven" },
            { title: t("auto.skjenkekontroll"), desc: "Hva kommunen ser etter ved tilsyn", url: "https://www.helsedirektoratet.no/veiledere/alkoholloven" },
          ].map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1">
                      {item.title}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function IkAlkoholDokumentsenter() {
  return (
    <ModuleDokumentsenter
      config={{
        moduleType: "ik-alkohol",
        subtitle: t("auto.maler_og_egne_dokumenter_for_ik_alkohol"),
        accentColor: "amber",
        spinnerClass: "border-amber-500",
        defaultFolderColorClass: "bg-amber-500",
        templatesTabLabel: t("auto.maler"),
        extraTab: {
          value: "ressurser",
          label: t("auto.ressurser"),
          content: <IkAlkoholResources />,
        },
      }}
    />
  );
}
