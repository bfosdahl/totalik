import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, FileText, Scale, BookOpen, ClipboardList, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Resource {
  title: string;
  description: string;
  type: "mal" | "eksempel" | "lov" | "veileder";
  icon: React.ReactNode;
  url?: string;
  downloadPath?: string;
}

const resources: Resource[] = [
  // Maler
  {
    title: "Internkontroll for skjenkesteder – MAL",
    description: "Tom mal for å dokumentere internkontrollsystem for skjenkesteder",
    type: "mal",
    icon: <ClipboardList className="h-5 w-5 text-amber-600" />,
    downloadPath: "/documents/Internkontroll_alkoholloven_-_MAL_-_skjenkesteder.docx",
  },
  {
    title: "Internkontroll for salgssteder – MAL",
    description: "Tom mal for å dokumentere internkontrollsystem for salgssteder",
    type: "mal",
    icon: <ClipboardList className="h-5 w-5 text-amber-600" />,
    downloadPath: "/documents/Internkontroll_alkoholloven_-_MAL_-_salgssteder.docx",
  },
  // Eksempler
  {
    title: "Ferdig utfylt mal – Skjenkested (Tenkt Pub AS)",
    description: "Komplett eksempel på utfylt internkontroll for et typisk skjenkested",
    type: "eksempel",
    icon: <FileText className="h-5 w-5 text-blue-600" />,
    downloadPath: "/documents/Internkontroll-eksempelmal-skjenkesteder.docx",
  },
  {
    title: "Ferdig utfylt mal – Salgssted (Tenkte Dagligvarer AS)",
    description: "Komplett eksempel på utfylt internkontroll for en dagligvarebutikk",
    type: "eksempel",
    icon: <FileText className="h-5 w-5 text-blue-600" />,
    downloadPath: "/documents/Internkontroll-eksempelmal-salgssteder.docx",
  },
  // Lover og forskrifter
  {
    title: "Alkoholloven",
    description: "Lov om omsetning av alkoholholdig drikk m.v.",
    type: "lov",
    icon: <Scale className="h-5 w-5 text-red-600" />,
    url: "https://lovdata.no/dokument/NL/lov/1989-06-02-27",
  },
  {
    title: "Alkoholforskriften",
    description: "Forskrift om omsetning av alkoholholdig drikk mv.",
    type: "lov",
    icon: <Scale className="h-5 w-5 text-red-600" />,
    url: "https://lovdata.no/dokument/SF/forskrift/2005-06-08-538",
  },
  {
    title: "Alkoholloven med kommentarer",
    description: "Helsedirektoratets kommentarer til alkoholloven (PDF)",
    type: "lov",
    icon: <Scale className="h-5 w-5 text-red-600" />,
    downloadPath: "/documents/Alkoholloven_med_kommentarer.pdf",
  },
  {
    title: "Alkoholforskriften med kommentarer",
    description: "Helsedirektoratets kommentarer til alkoholforskriften (PDF)",
    type: "lov",
    icon: <Scale className="h-5 w-5 text-red-600" />,
    downloadPath: "/documents/Alkoholforskriften_med_kommentarer.pdf",
  },
  // Veiledere
  {
    title: "Veileder i salgs- og skjenkekontroll",
    description: "Helsedirektoratets veileder for kommunenes kontroll (PDF)",
    type: "veileder",
    icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
    downloadPath: "/documents/Salgs-_og_skjenkekontroll_-_Veileder.pdf",
  },
  {
    title: "Guide til god internkontroll etter alkoholloven",
    description: "Helsedirektoratets offisielle guide med praktiske råd for alle stedstyper",
    type: "veileder",
    icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
    url: "https://www.helsedirektoratet.no/tema/alkohol/guide-til-god-internkontroll-etter-alkoholloven",
  },
  {
    title: "Helsedirektoratets e-læringskurs",
    description: "Gratis e-læringskurs for ansatte i skjenkebransjen",
    type: "veileder",
    icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
    url: "https://kurs.helsedirektoratet.no/",
  },
];

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  mal: { label: "Mal", color: "bg-amber-100 text-amber-800 border-amber-200" },
  eksempel: { label: "Eksempel", color: "bg-blue-100 text-blue-800 border-blue-200" },
  lov: { label: "Lov/Forskrift", color: "bg-red-100 text-red-800 border-red-200" },
  veileder: { label: "Veileder", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function IkAlkoholRessursbank() {
  const navigate = useNavigate();

  const handleClick = (resource: Resource) => {
    if (resource.url) {
      window.open(resource.url, "_blank");
    } else if (resource.downloadPath) {
      const a = document.createElement("a");
      a.href = resource.downloadPath;
      a.download = resource.downloadPath.split("/").pop() || "dokument";
      a.click();
    }
  };

  const grouped = {
    mal: resources.filter(r => r.type === "mal"),
    eksempel: resources.filter(r => r.type === "eksempel"),
    lov: resources.filter(r => r.type === "lov"),
    veileder: resources.filter(r => r.type === "veileder"),
  };

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Ressursbank</h1>
          <p className="text-muted-foreground mt-1">
            Maler, eksempler, lover og veiledere for internkontroll etter alkoholloven
          </p>
        </div>

        {(Object.entries(grouped) as [string, Resource[]][]).map(([type, items]) => (
          <div key={type}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {items[0]?.icon}
              {type === "mal" && "Maler"}
              {type === "eksempel" && "Eksempler på utfylte maler"}
              {type === "lov" && "Lover og forskrifter"}
              {type === "veileder" && "Veiledere og kurs"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((resource, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => handleClick(resource)}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="mt-0.5">{resource.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{resource.title}</h3>
                        <Badge variant="outline" className={`text-xs shrink-0 ${TYPE_LABELS[resource.type].color}`}>
                          {TYPE_LABELS[resource.type].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{resource.description}</p>
                    </div>
                    {resource.url ? (
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    ) : (
                      <Download className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
