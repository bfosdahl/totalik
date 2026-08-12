import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "@/i18n/t";
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
            <h1 className="text-3xl font-bold">{t("auto.brukerveiledning")}</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {t("auto.laer_hvordan_du_bruker_systemet_og_de_ul")}
          </p>
        </div>

        <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2 bg-muted/50">
            <TabsTrigger value="ik-hms" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auto.ik_hms")}</span>
            </TabsTrigger>
            <TabsTrigger value="ik-mat" className="flex items-center gap-2 py-3">
              <ChefHat className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auto.ik_mat")}</span>
            </TabsTrigger>
            <TabsTrigger value="ks-bygg" className="flex items-center gap-2 py-3">
              <HardHat className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auto.ks_bygg")}</span>
            </TabsTrigger>
            <TabsTrigger value="generelt" className="flex items-center gap-2 py-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auto.generelt")}</span>
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
                    <CardTitle>{t("auto.ik_hms_internkontroll_for_helse_miljoe_o")}</CardTitle>
                    <CardDescription>
                      {t("auto.komplett_system_for_aa_oppfylle_kravene_")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">{t("auto.hva_er_ik_hms")}</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        {t("auto.internkontrollforskriften_paalegger_alle")}
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
                        <p className="font-semibold">{t("auto.oppsett")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.kom_i_gang_med_hms_arbeidet")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.oppsett_siden_er_startpunktet_for_aa_byg")}
                      </p>
                      
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">{t("auto.tips_bruk_oppsett_hjelperen")}</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                              Klikk på "Oppsett-hjelperen" knappen øverst på siden for å få AI-assistert hjelp til å sette opp 
                              HMS-systemet basert på din bransje og bedriftsstørrelse.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.fanene_i_oppsett")}</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.maalsetting")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.definer_hms_maalene_for_bedriften_velg_f")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.organisering")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.sett_opp_organisasjonskartet_med_roller_")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.risikovurdering")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.identifiser_farekilder_og_vurder_risiko_")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.handlingsplan")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.lag_tiltak_for_aa_redusere_risiko_med_an")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.rutiner")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.dokumenter_hms_rutiner_for_ulike_arbeids")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.haandbok")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.generer_en_komplett_hms_haandbok_som_pdf")}</p>
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
                        <p className="font-semibold">{t("auto.maalsetting")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.sett_hms_maal_for_bedriften")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.her_definerer_du_bedriftens_hms_maal_maa")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.slik_bruker_du_maalsetting_siden")}</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>{t("auto.gjennomgaa_de_forhaandsdefinerte_maalene")}</li>
                          <li>Legg til egne mål ved å klikke "Legg til mål"</li>
                          <li>{t("auto.prioriter_maalene_etter_viktighet")}</li>
                          <li>{t("auto.maalene_blir_automatisk_inkludert_i_hms_")}</li>
                        </ol>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Lightbulb className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">{t("auto.eksempler_paa_gode_maal")}</p>
                            <ul className="text-sm text-green-800 dark:text-green-200 mt-1 space-y-1">
                              <li>{t("auto.null_arbeidsulykker_med_fravaer")}</li>
                              <li>{t("auto.redusere_sykefravaer_med_10_innen_aaret")}</li>
                              <li>{t("auto.gjennomfoere_vernerunde_hver_maaned")}</li>
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
                        <p className="font-semibold">{t("auto.organisering")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.roller_og_ansvar_i_hms_arbeidet")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.organiseringssiden_dokumenterer_hvem_som")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.viktige_roller")}</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline" className="shrink-0">{t("auto.paakrevd")}</Badge>
                            <div>
                              <p className="font-medium">{t("auto.daglig_leder")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.har_det_overordnede_ansvaret_for_hms_arb")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline" className="shrink-0">{t("auto.anbefalt")}</Badge>
                            <div>
                              <p className="font-medium">{t("auto.hms_ansvarlig")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.koordinerer_det_daglige_hms_arbeidet")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline" className="shrink-0">{t("auto.ved_5_ansatte")}</Badge>
                            <div>
                              <p className="font-medium">{t("auto.verneombud")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.ivaretar_arbeidstakernes_interesser_i_hm")}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">{t("auto.unntak_fra_verneombudskravet")}</p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                              {t("auto.bedrifter_med_faerre_enn_5_ansatte_kan_a")}
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
                        <p className="font-semibold">{t("auto.risikovurdering")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.identifiser_og_vurder_farer")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.risikovurdering_er_kjernen_i_hms_arbeide")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.slik_gjoer_du_en_risikovurdering")}</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li><strong>{t("auto.identifiser_farekilde")}</strong> - Hva kan forårsake skade? (f.eks. "Arbeid i høyden")</li>
                          <li><strong>{t("auto.beskriv_uoensket_hendelse")}</strong> - Hva kan skje? (f.eks. "Fall fra stige")</li>
                          <li><strong>{t("auto.vurder_sannsynlighet")}</strong> - Hvor ofte kan dette skje? (1-5)</li>
                          <li><strong>{t("auto.vurder_konsekvens")}</strong> - Hvor alvorlig blir skaden? (1-5)</li>
                          <li><strong>{t("auto.beregn_risiko")}</strong> {t("auto.systemet_beregner_risikonivaa_automatisk")}</li>
                          <li><strong>{t("auto.planlegg_tiltak")}</strong> {t("auto.hva_kan_gjoeres_for_aa_redusere_risikoen")}</li>
                        </ol>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <p className="font-bold text-green-700 dark:text-green-300">{t("auto.groenn")}</p>
                          <p className="text-green-600 dark:text-green-400">Lav risiko (1-4)</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <p className="font-bold text-yellow-700 dark:text-yellow-300">{t("auto.gul")}</p>
                          <p className="text-yellow-600 dark:text-yellow-400">Middels risiko (5-12)</p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <p className="font-bold text-red-700 dark:text-red-300">{t("auto.roed")}</p>
                          <p className="text-red-600 dark:text-red-400">Høy risiko (13-25)</p>
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900 dark:text-red-100">{t("auto.viktig_om_roede_risikoer")}</p>
                            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                              {t("auto.roede_risikoer_krever_obligatorisk_revur")}
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
                        <p className="font-semibold">{t("auto.ansatte")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.administrer_ansatte_og_kompetanse")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.ansattelisten_gir_oversikt_over_alle_ans")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.funksjoner")}</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.kursregister")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.hold_oversikt_over_kurs_og_sertifikater_")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.hms_kort")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.registrer_hms_kort_med_bilde_og_utloepsd")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.dokumenter")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.last_opp_arbeidskontrakter_attester_og_a")}</p>
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
                        <p className="font-semibold">{t("auto.avvik")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.rapporter_og_foelg_opp_avvik")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.avvikssystemet_brukes_til_aa_registrere_")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.to_typer_rapporter")}</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge className="bg-blue-500">{t("auto.avvik")}</Badge>
                            <div>
                              <p className="font-medium">{t("auto.kvalitetsavvik")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.brudd_paa_rutiner_mangler_i_dokumentasjo")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge className="bg-red-500">RUH</Badge>
                            <div>
                              <p className="font-medium">{t("auto.rapport_uoensket_hendelse")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.ulykker_nestenulykker_skader_inkluderer_")}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.avviksprosessen")}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{t("auto.ny")}</Badge>
                          <ArrowRight className="h-4 w-4" />
                          <Badge variant="outline" className="bg-yellow-100">{t("auto.under_behandling")}</Badge>
                          <ArrowRight className="h-4 w-4" />
                          <Badge variant="outline" className="bg-green-100">{t("auto.lukket")}</Badge>
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
                        <p className="font-semibold">{t("auto.hms_aktiviteter_2")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.planlegg_og_gjennomfoer_hms_aktiviteter")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.her_planlegger_og_dokumenterer_du_loepen")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.tilgjengelige_skjemaer")}</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.vernerunde")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.systematisk_gjennomgang_av_arbeidsplasse")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.aarlig_hms_revisjon")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.gjennomgang_av_hele_hms_systemet_aarlig")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.elektrisk_kontroll")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.dokumentasjon_av_elektrisk_anlegg_og_uts")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.lover_og_forskrifter")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.finn_hvilke_lover_og_forskrifter_som_gje")}</p>
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
                        <p className="font-semibold">{t("auto.stoffkartotek")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.oversikt_over_kjemikalier")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.stoffkartoteket_gir_oversikt_over_alle_k")}
                      </p>
                      
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">{t("auto.automatisk_utfylling")}</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                              Last opp et sikkerhetsdatablad (SDS) som PDF, og systemet fyller automatisk ut 
                              produktnavn, produsent og fareklasser ved hjelp av AI.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.for_hvert_kjemikalie_registreres")}</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>{t("auto.produktnavn_og_produsent")}</li>
                          <li>{t("auto.fareklasser_og_faresymboler")}</li>
                          <li>{t("auto.bruksomraade")}</li>
                          <li>Sikkerhetsdatablad (PDF)</li>
                          <li>{t("auto.notater_om_bruk_og_haandtering")}</li>
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
                        <p className="font-semibold">{t("auto.hms_assistent")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.ai_drevet_hjelp_med_hms")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.hms_assistenten_er_en_ai_chatbot_som_kan")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.eksempler_paa_hva_du_kan_spoerre_om")}</p>
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
                        <p className="font-semibold">{t("auto.timeregistrering")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.registrer_arbeidstid")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.timeregistreringssystemet_lar_ansatte_re")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.funksjoner")}</p>
                        <div className="grid gap-3">
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.manuell_registrering")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.legg_inn_timer_med_start_slutt_tid_og_be")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.stemplingsur")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.stemple_inn_ut_med_ett_klikk_eller_qr_ko")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.ukeoversikt")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.se_timer_per_dag_og_totalt_for_uken")}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{t("auto.eksport")}</p>
                              <p className="text-sm text-muted-foreground">{t("auto.eksporter_timelister_til_excel")}</p>
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
                        <p className="font-semibold">{t("auto.hms_haandbok")}</p>
                        <p className="text-sm text-muted-foreground font-normal">{t("auto.generer_komplett_dokumentasjon")}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        {t("auto.hms_haandboken_samler_all_informasjon_du")}
                      </p>
                      
                      <div className="space-y-3">
                        <p className="font-medium">{t("auto.haandboken_inneholder")}</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>{t("auto.bedriftsinformasjon_og_logo")}</li>
                          <li>{t("auto.hms_maal_og_policy")}</li>
                          <li>{t("auto.organisasjonskart_med_roller_og_ansvar")}</li>
                          <li>{t("auto.risikovurderinger_og_handlingsplaner")}</li>
                          <li>{t("auto.rutiner_og_prosedyrer_2")}</li>
                          <li>{t("auto.lover_og_forskrifter_som_gjelder")}</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Lightbulb className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">{t("auto.tips_3")}</p>
                            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                              {t("auto.haandboken_oppdateres_automatisk_naar_du")}
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
                    <CardTitle>{t("auto.ik_mat_internkontroll_for_mattrygghet")}</CardTitle>
                    <CardDescription>
                      {t("auto.dokumentasjon_kommer_snart")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{t("auto.brukerveiledning_for_ik_mat_modulen_er_u")}</p>
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
                    <CardTitle>{t("auto.ks_bygg_kvalitetssikring_for_byggeprosje")}</CardTitle>
                    <CardDescription>
                      {t("auto.dokumentasjon_kommer_snart")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <HardHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{t("auto.brukerveiledning_for_ks_bygg_modulen_er_")}</p>
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
                    <CardTitle>{t("auto.generell_bruk")}</CardTitle>
                    <CardDescription>
                      {t("auto.dokumentasjon_kommer_snart")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{t("auto.generell_brukerveiledning_er_under_utvik")}</p>
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
