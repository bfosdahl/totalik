import { Scale, ExternalLink, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";

const regulations = [
  {
    category: "Arbeidsmiljø",
    items: [
      {
        name: "Arbeidsmiljøloven",
        description: "Lov om arbeidsmiljø, arbeidstid og stillingsvern mv.",
        link: "https://lovdata.no/dokument/NL/lov/2005-06-17-62",
        relevance: "Krav til forsvarlig arbeidsmiljø i bygninger",
      },
      {
        name: "Internkontrollforskriften",
        description: "Forskrift om systematisk helse-, miljø- og sikkerhetsarbeid i virksomheter",
        link: "https://lovdata.no/dokument/SF/forskrift/1996-12-06-1127",
        relevance: "Krav til systematisk HMS-arbeid, inkludert bygningsrelaterte forhold",
      },
    ],
  },
  {
    category: "Brann og sikkerhet",
    items: [
      {
        name: "Brann- og eksplosjonsvernloven",
        description: "Lov om vern mot brann, eksplosjon og ulykker med farlig stoff",
        link: "https://lovdata.no/dokument/NL/lov/2002-06-14-20",
        relevance: "Overordnet lov for brannvern i bygninger",
      },
      {
        name: "Forskrift om brannforebygging",
        description: "Forskrift om brannforebygging",
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
        description: "Lov om tilsyn med elektriske anlegg og elektrisk utstyr",
        link: "https://lovdata.no/dokument/NL/lov/1929-05-24-4",
        relevance: "Krav til elektriske installasjoner og kontroller",
      },
      {
        name: "Forskrift om elektriske lavspenningsanlegg (FEL)",
        description: "Krav til prosjektering, utførelse og vedlikehold av elektriske anlegg",
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
        description: "Lov om planlegging og byggesaksbehandling",
        link: "https://lovdata.no/dokument/NL/lov/2008-06-27-71",
        relevance: "Overordnede krav til bygg og endringer",
      },
      {
        name: "TEK17 (Byggteknisk forskrift)",
        description: "Forskrift om tekniske krav til byggverk",
        link: "https://lovdata.no/dokument/SF/forskrift/2017-06-19-840",
        relevance: "Tekniske krav ved bygging og endring av byggverk",
      },
    ],
  },
  {
    category: "Inneklima og ventilasjon",
    items: [
      {
        name: "Forskrift om miljørettet helsevern",
        description: "Krav til inneklima i offentlige bygg og arbeidsplasser",
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
            Relevant regelverk for forvaltning, drift og vedlikehold av bygg
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium mb-1">Om denne oversikten</h3>
                <p className="text-sm text-muted-foreground">
                  Denne siden gir en oversikt over de viktigste lovene og forskriftene som gjelder for 
                  forvaltning, drift og vedlikehold av næringsbygg. Oversikten er kun informativ og 
                  kan ikke redigeres. Ved tvil om lovtolkning, kontakt relevant tilsynsmyndighet.
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
              <strong>Ansvarsfraskrivelse:</strong> Denne oversikten er kun ment som en veiledning og 
              erstatter ikke juridisk rådgivning. Regelverket endres jevnlig, og det er virksomhetens 
              ansvar å holde seg oppdatert på gjeldende krav. Lovdata.no inneholder alltid den 
              oppdaterte versjonen av regelverket.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
