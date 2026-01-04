import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield, 
  Target, 
  Building2, 
  AlertTriangle, 
  Users, 
  Clock, 
  FileText, 
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Info,
  Lightbulb,
  ChefHat,
  HardHat,
  Settings
} from "lucide-react";

const Brukerveiledning = () => {
  const [activeModule, setActiveModule] = useState("ik-hms");

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Brukerveiledning</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Lær hvordan du bruker systemet og de ulike modulene
          </p>
        </div>

        <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2 bg-muted/50">
            <TabsTrigger value="ik-hms" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">IK/HMS</span>
            </TabsTrigger>
            <TabsTrigger value="ik-mat" className="flex items-center gap-2 py-3">
              <ChefHat className="h-4 w-4" />
              <span className="hidden sm:inline">IK/MAT</span>
            </TabsTrigger>
            <TabsTrigger value="ks-bygg" className="flex items-center gap-2 py-3">
              <HardHat className="h-4 w-4" />
              <span className="hidden sm:inline">KS Bygg</span>
            </TabsTrigger>
            <TabsTrigger value="generelt" className="flex items-center gap-2 py-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Generelt</span>
            </TabsTrigger>
          </TabsList>

          {/* IK/HMS Module */}
          <TabsContent value="ik-hms" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Shield className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle>IK/HMS - Internkontroll for Helse, Miljø og Sikkerhet</CardTitle>
                    <CardDescription>
                      Komplett system for å oppfylle kravene i Internkontrollforskriften
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Hva er IK/HMS?</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        Internkontrollforskriften pålegger alle norske virksomheter å jobbe systematisk med helse, miljø og sikkerhet. 
                        Dette systemet hjelper deg å dokumentere og følge opp dette arbeidet på en enkel måte.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ScrollArea className="h-[600px] pr-4">
              <Accordion type="multiple" defaultValue={["oppsett"]} className="space-y-4">
                {/* Oppsett */}
                <AccordionItem value="oppsett" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Oppsett</p>
                        <p className="text-sm text-muted-foreground font-normal">Kom i gang med HMS-arbeidet</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Oppsett-siden er startpunktet for å bygge opp din HMS-dokumentasjon. Her fyller du ut grunnleggende informasjon 
                        om bedriften og setter opp strukturen for HMS-arbeidet.
                      </p>
                      
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">Tips: Bruk Oppsett-hjelperen</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                              Klikk på "Oppsett-hjelperen" knappen øverst på siden for å få AI-assistert hjelp til å sette opp 
                              HMS-systemet basert på din bransje og bedriftsstørrelse.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="font-medium">Fanene i Oppsett:</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Målsetting</p>
                              <p className="text-sm text-muted-foreground">Definer HMS-målene for bedriften. Velg fra forhåndsdefinerte mål eller legg til egne.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Organisering</p>
                              <p className="text-sm text-muted-foreground">Sett opp organisasjonskartet med roller og ansvar for HMS-arbeidet.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Risikovurdering</p>
                              <p className="text-sm text-muted-foreground">Identifiser farekilder og vurder risiko ved hjelp av 5x5-matrisen.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Handlingsplan</p>
                              <p className="text-sm text-muted-foreground">Lag tiltak for å redusere risiko, med ansvarlige og frister.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Rutiner</p>
                              <p className="text-sm text-muted-foreground">Dokumenter HMS-rutiner for ulike arbeidsoppgaver og situasjoner.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Håndbok</p>
                              <p className="text-sm text-muted-foreground">Generer en komplett HMS-håndbok som PDF basert på informasjonen du har lagt inn.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Målsetting */}
                <AccordionItem value="maalsetting" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/10">
                        <Target className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Målsetting</p>
                        <p className="text-sm text-muted-foreground font-normal">Sett HMS-mål for bedriften</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Her definerer du bedriftens HMS-mål. Målene bør være konkrete og målbare, slik at du kan følge opp 
                        om de nås.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">Slik bruker du målsetting-siden:</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Gjennomgå de forhåndsdefinerte målene og velg hvilke som passer for din bedrift</li>
                          <li>Legg til egne mål ved å klikke "Legg til mål"</li>
                          <li>Prioriter målene etter viktighet</li>
                          <li>Målene blir automatisk inkludert i HMS-håndboken</li>
                        </ol>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Lightbulb className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">Eksempler på gode mål</p>
                            <ul className="text-sm text-green-800 dark:text-green-200 mt-1 space-y-1">
                              <li>• Null arbeidsulykker med fravær</li>
                              <li>• Redusere sykefravær med 10% innen året</li>
                              <li>• Gjennomføre vernerunde hver måned</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Organisering */}
                <AccordionItem value="organisering" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10">
                        <Building2 className="h-5 w-5 text-sky-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Organisering</p>
                        <p className="text-sm text-muted-foreground font-normal">Roller og ansvar i HMS-arbeidet</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Organiseringssiden dokumenterer hvem som har ansvar for ulike deler av HMS-arbeidet. 
                        Dette er et krav i Internkontrollforskriften.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">Viktige roller:</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline" className="shrink-0">Påkrevd</Badge>
                            <div>
                              <p className="font-medium">Daglig leder</p>
                              <p className="text-sm text-muted-foreground">Har det overordnede ansvaret for HMS-arbeidet.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline" className="shrink-0">Anbefalt</Badge>
                            <div>
                              <p className="font-medium">HMS-ansvarlig</p>
                              <p className="text-sm text-muted-foreground">Koordinerer det daglige HMS-arbeidet.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline" className="shrink-0">Ved 5+ ansatte</Badge>
                            <div>
                              <p className="font-medium">Verneombud</p>
                              <p className="text-sm text-muted-foreground">Ivaretar arbeidstakernes interesser i HMS-spørsmål.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">Unntak fra verneombudskravet</p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                              Bedrifter med færre enn 5 ansatte kan avtale skriftlig med de ansatte at de ikke skal ha verneombud. 
                              Denne avtalen kan signeres digitalt i systemet.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Risikovurdering */}
                <AccordionItem value="risikovurdering" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Risikovurdering</p>
                        <p className="text-sm text-muted-foreground font-normal">Identifiser og vurder farer</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Risikovurdering er kjernen i HMS-arbeidet. Her identifiserer du farekilder, 
                        vurderer sannsynlighet og konsekvens, og planlegger tiltak.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">Slik gjør du en risikovurdering:</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li><strong>Identifiser farekilde</strong> - Hva kan forårsake skade? (f.eks. "Arbeid i høyden")</li>
                          <li><strong>Beskriv uønsket hendelse</strong> - Hva kan skje? (f.eks. "Fall fra stige")</li>
                          <li><strong>Vurder sannsynlighet</strong> - Hvor ofte kan dette skje? (1-5)</li>
                          <li><strong>Vurder konsekvens</strong> - Hvor alvorlig blir skaden? (1-5)</li>
                          <li><strong>Beregn risiko</strong> - Systemet beregner risikonivå automatisk</li>
                          <li><strong>Planlegg tiltak</strong> - Hva kan gjøres for å redusere risikoen?</li>
                        </ol>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <p className="font-bold text-green-700 dark:text-green-300">Grønn</p>
                          <p className="text-green-600 dark:text-green-400">Lav risiko (1-4)</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <p className="font-bold text-yellow-700 dark:text-yellow-300">Gul</p>
                          <p className="text-yellow-600 dark:text-yellow-400">Middels risiko (5-12)</p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <p className="font-bold text-red-700 dark:text-red-300">Rød</p>
                          <p className="text-red-600 dark:text-red-400">Høy risiko (13-25)</p>
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900 dark:text-red-100">Viktig om røde risikoer</p>
                            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                              Røde risikoer krever obligatorisk revurdering etter at tiltak er iverksatt. 
                              Du må dokumentere at risikoen er redusert før den kan lukkes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Ansatte */}
                <AccordionItem value="ansatte" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Users className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Ansatte</p>
                        <p className="text-sm text-muted-foreground font-normal">Administrer ansatte og kompetanse</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Ansattelisten gir oversikt over alle ansatte med deres kurs, HMS-kort og dokumenter.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">Funksjoner:</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Kursregister</p>
                              <p className="text-sm text-muted-foreground">Hold oversikt over kurs og sertifikater med utløpsdato. Systemet varsler automatisk før kurs utløper.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">HMS-kort</p>
                              <p className="text-sm text-muted-foreground">Registrer HMS-kort med bilde og utløpsdato.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Dokumenter</p>
                              <p className="text-sm text-muted-foreground">Last opp arbeidskontrakter, attester og andre dokumenter per ansatt.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Avvik */}
                <AccordionItem value="avvik" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Avvik</p>
                        <p className="text-sm text-muted-foreground font-normal">Rapporter og følg opp avvik</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Avvikssystemet brukes til å registrere og følge opp hendelser, nestenulykker og brudd på rutiner.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">To typer rapporter:</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge className="bg-blue-500">Avvik</Badge>
                            <div>
                              <p className="font-medium">Kvalitetsavvik</p>
                              <p className="text-sm text-muted-foreground">Brudd på rutiner, mangler i dokumentasjon, etc.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge className="bg-red-500">RUH</Badge>
                            <div>
                              <p className="font-medium">Rapport Uønsket Hendelse</p>
                              <p className="text-sm text-muted-foreground">Ulykker, nestenulykker, skader. Inkluderer ekstra felt for alvorlighetsgrad og årsaksanalyse.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="font-medium">Avviksprosessen:</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">Ny</Badge>
                          <ArrowRight className="h-4 w-4" />
                          <Badge variant="outline" className="bg-yellow-100">Under behandling</Badge>
                          <ArrowRight className="h-4 w-4" />
                          <Badge variant="outline" className="bg-green-100">Lukket</Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* HMS-aktiviteter */}
                <AccordionItem value="aktiviteter" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10">
                        <ClipboardCheck className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">HMS-aktiviteter</p>
                        <p className="text-sm text-muted-foreground font-normal">Planlegg og gjennomfør HMS-aktiviteter</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Her planlegger og dokumenterer du løpende HMS-aktiviteter som vernerunder, revisjoner og kontroller.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">Tilgjengelige skjemaer:</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Vernerunde</p>
                              <p className="text-sm text-muted-foreground">Systematisk gjennomgang av arbeidsplassen med sjekkliste.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Årlig HMS-revisjon</p>
                              <p className="text-sm text-muted-foreground">Gjennomgang av hele HMS-systemet årlig.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Elektrisk kontroll</p>
                              <p className="text-sm text-muted-foreground">Dokumentasjon av elektrisk anlegg og utstyr.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Lover og forskrifter</p>
                              <p className="text-sm text-muted-foreground">Finn hvilke lover og forskrifter som gjelder for din bedrift.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Stoffkartotek */}
                <AccordionItem value="stoffkartotek" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10">
                        <FileText className="h-5 w-5 text-teal-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Stoffkartotek</p>
                        <p className="text-sm text-muted-foreground font-normal">Oversikt over kjemikalier</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Stoffkartoteket gir oversikt over alle kjemikalier og farlige stoffer som brukes i bedriften.
                      </p>
                      
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">Automatisk utfylling</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                              Last opp et sikkerhetsdatablad (SDS) som PDF, og systemet fyller automatisk ut 
                              produktnavn, produsent og fareklasser ved hjelp av AI.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="font-medium">For hvert kjemikalie registreres:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Produktnavn og produsent</li>
                          <li>Fareklasser og faresymboler</li>
                          <li>Bruksområde</li>
                          <li>Sikkerhetsdatablad (PDF)</li>
                          <li>Notater om bruk og håndtering</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* HMS-assistent */}
                <AccordionItem value="assistent" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <MessageSquare className="h-5 w-5 text-violet-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">HMS-assistent</p>
                        <p className="text-sm text-muted-foreground font-normal">AI-drevet hjelp med HMS</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        HMS-assistenten er en AI-chatbot som kan svare på spørsmål om HMS og hjelpe deg med dokumentasjon.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">Eksempler på hva du kan spørre om:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>"Hva er kravene til verneombud?"</li>
                          <li>"Hvordan gjennomfører jeg en risikovurdering?"</li>
                          <li>"Hvilke rutiner trenger vi for arbeid i høyden?"</li>
                          <li>"Hjelp meg å skrive en rutine for brannvern"</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Timeregistrering */}
                <AccordionItem value="timer" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-500/10">
                        <Clock className="h-5 w-5 text-rose-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Timeregistrering</p>
                        <p className="text-sm text-muted-foreground font-normal">Registrer arbeidstid</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Timeregistreringssystemet lar ansatte registrere arbeidstid enkelt og oversiktlig.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">Funksjoner:</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Manuell registrering</p>
                              <p className="text-sm text-muted-foreground">Legg inn timer med start/slutt-tid og beskrivelse.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Stemplingsur</p>
                              <p className="text-sm text-muted-foreground">Stemple inn/ut med ett klikk eller QR-kode.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Ukeoversikt</p>
                              <p className="text-sm text-muted-foreground">Se timer per dag og totalt for uken.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Eksport</p>
                              <p className="text-sm text-muted-foreground">Eksporter timelister til Excel.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Håndbok */}
                <AccordionItem value="handbok" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <BookOpen className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">HMS-håndbok</p>
                        <p className="text-sm text-muted-foreground font-normal">Generer komplett dokumentasjon</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        HMS-håndboken samler all informasjon du har lagt inn i systemet til ett komplett dokument 
                        som kan lastes ned som PDF.
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">Håndboken inneholder:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Bedriftsinformasjon og logo</li>
                          <li>HMS-mål og policy</li>
                          <li>Organisasjonskart med roller og ansvar</li>
                          <li>Risikovurderinger og handlingsplaner</li>
                          <li>Rutiner og prosedyrer</li>
                          <li>Lover og forskrifter som gjelder</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Lightbulb className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">Tips</p>
                            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                              Håndboken oppdateres automatisk når du gjør endringer i systemet. 
                              Du kan når som helst laste ned en oppdatert versjon.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
          </TabsContent>

          {/* IK/MAT Module - Placeholder */}
          <TabsContent value="ik-mat">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <ChefHat className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle>IK/MAT - Internkontroll for Mattrygghet</CardTitle>
                    <CardDescription>
                      Dokumentasjon kommer snart...
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Brukerveiledning for IK/MAT-modulen er under utvikling.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KS Bygg Module - Placeholder */}
          <TabsContent value="ks-bygg">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <HardHat className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>KS Bygg - Kvalitetssikring for Byggeprosjekter</CardTitle>
                    <CardDescription>
                      Dokumentasjon kommer snart...
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <HardHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Brukerveiledning for KS Bygg-modulen er under utvikling.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General - Placeholder */}
          <TabsContent value="generelt">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-500/10">
                    <Settings className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <CardTitle>Generell bruk</CardTitle>
                    <CardDescription>
                      Dokumentasjon kommer snart...
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Generell brukerveiledning er under utvikling.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Brukerveiledning;
