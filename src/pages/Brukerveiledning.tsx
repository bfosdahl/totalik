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
                          <p className="text-red-600 dark:text-red-400">{t("auto.hoey_risiko_13_25")}</p>
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

          {/* IK/MAT Module */}
          <TabsContent value="ik-mat" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <ChefHat className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle>IK/MAT – Internkontroll for mattrygghet</CardTitle>
                    <CardDescription>
                      Komplett system for HACCP, temperaturkontroll, renhold og sporbarhet
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Hva er IK-Mat?</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        Alle virksomheter som håndterer mat må ha et internkontrollsystem basert på HACCP-prinsippene.
                        Modulen dekker Mattilsynets krav til rutiner, temperaturlogg, renhold, sporbarhet og avvik.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ScrollArea className="h-[600px] pr-4">
              <Accordion type="multiple" defaultValue={["mat-oppsett"]} className="space-y-4">
                <AccordionItem value="mat-oppsett" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <ClipboardCheck className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Oppsett</p>
                        <p className="text-sm text-muted-foreground font-normal">Kom i gang med IK-Mat</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Under IK MAT &gt; Oppsett beskriver du virksomheten (kafé, restaurant, kantine, butikk),
                        antall ansatte og hvilket utstyr dere har. AI-oppsettet lager forslag til mål, HACCP-plan,
                        renholdsplan og rutiner som passer driften. Alt kan redigeres etterpå.
                      </p>
                      <div className="space-y-3">
                        <p className="font-medium">Slik gjør du det</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Fyll ut virksomhetstype og antall ansatte</li>
                          <li>Registrer utstyr: kjøleskap, kjølerom, frysere, oppvaskmaskiner</li>
                          <li>Kjør oppsett-hjelperen og se gjennom forslagene</li>
                          <li>Juster rutiner, sjekklister og ansvarlige</li>
                          <li>Skru på eller av påminnelser for daglige oppgaver</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mat-temperatur" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10">
                        <Target className="h-5 w-5 text-sky-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Temperaturlogg</p>
                        <p className="text-sm text-muted-foreground font-normal">Daglig kontroll av kjøl, frys og varmebehandling</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Hvert apparat får egen ID og inngår automatisk i temperaturloggen. Ansatte registrerer
                        temperatur på mobil, og systemet varsler dersom verdien er utenfor grenseverdiene.
                      </p>
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Kjøl under 4 °C, frys under -18 °C</p>
                            <p className="text-sm text-muted-foreground">Anbefalt daglig logging av alle enheter</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Varmebehandling, nedkjøling og oppvarming</p>
                            <p className="text-sm text-muted-foreground">Kjernetemperatur dokumenteres som egne kontroller</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Sensorer</p>
                            <p className="text-sm text-muted-foreground">Tredjeparts temperatursensorer kan sende målinger automatisk inn i loggen</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900 dark:text-red-100">Automatisk avvik</p>
                            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                              Registreres en temperatur utenfor grenseverdiene, opprettes det automatisk et avvik
                              med forslag til tiltak. Det samme skjer om en påkrevd kontroll ikke blir utført.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mat-renhold" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10">
                        <ClipboardCheck className="h-5 w-5 text-teal-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Renholdsplan og sjekklister</p>
                        <p className="text-sm text-muted-foreground font-normal">Daglige, ukentlige og månedlige oppgaver</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Renholdsplanen viser hva som skal gjøres daglig, ukentlig, månedlig og årlig – for eksempel
                        gulv og benker daglig, avtrekkshette og kjølerom ukentlig, og vinduer månedlig.
                        Ansatte huker av på mobilen, legger ved kommentar eller bilde og signerer.
                      </p>
                      <div className="space-y-3">
                        <p className="font-medium">Godt å vite</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Du kan lage egne oppgaver og bestemme hyppighet og ansvarlig</li>
                          <li>Oppgaver som ikke utføres gir avvik automatisk</li>
                          <li>Renholdsplanen kan skrives ut som PDF og henges opp på kjøkkenet</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mat-haccp" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">HACCP og risikovurdering</p>
                        <p className="text-sm text-muted-foreground font-normal">Kritiske styringspunkter i produksjonen</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        HACCP-planen kartlegger farer i hvert ledd fra mottak til servering, setter grenseverdier
                        for de kritiske punktene og beskriver hva som skal gjøres når en grense brytes.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Kartlegg farene (biologiske, kjemiske, fysiske og allergener)</li>
                        <li>Finn de kritiske styringspunktene (mottak, kjøling, varmebehandling)</li>
                        <li>Sett grenseverdier og hvordan de overvåkes</li>
                        <li>Beskriv korrigerende tiltak ved avvik</li>
                        <li>Dokumenter kontrollene i temperaturlogg og sjekklister</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mat-sporbarhet" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10">
                        <FileText className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Sporbarhet og leverandører</p>
                        <p className="text-sm text-muted-foreground font-normal">Mottakskontroll, batch og etiketter</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Under Sporbarhet registrerer du varemottak med leverandør, batchnummer og mottaksdato,
                        slik at du kan følge en råvare fra leverandør til servert rett. Du kan også skrive ut
                        etiketter med holdbarhet og åpningsdato.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Mottakskontroll med temperatur og tilstand på varen</li>
                        <li>Faste leverandøravtaler samlet ett sted</li>
                        <li>Allergener merkes på produktene</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mat-kjokkenplan" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Building2 className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Kjøkkenplan</p>
                        <p className="text-sm text-muted-foreground font-normal">Tegn soner og plasser utstyr</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Kjøkkenplanen er et visuelt verktøy der du tegner lokalet og plasserer soner
                        (ren/uren, varm/kald) og utstyr. Planen dokumenterer hygienesoner og vareflyt
                        overfor Mattilsynet, og kan lastes ned som PDF.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mat-dokumentasjon" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <BookOpen className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Dokumentasjon og tilsyn</p>
                        <p className="text-sm text-muted-foreground font-normal">Alt Mattilsynet ber om i én PDF</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        I Dokumentasjonssenteret klikker du Generer rapport og får en samlet PDF med mål,
                        HACCP-plan, rutiner, renholdsplan, sjekklister, temperaturlogg og avvik.
                      </p>
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Lightbulb className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">Tips</p>
                            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                              Spør MAT Proffen (chat-knappen nede til høyre) om HACCP, allergener eller hygiene –
                              assistenten kjenner både regelverket og ditt oppsett.
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

          {/* KS Bygg Module */}
          <TabsContent value="ks-bygg" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <HardHat className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>KS BYGG – Kvalitetssikring for byggeprosjekter</CardTitle>
                    <CardDescription>
                      Prosjektstyring, sjekklister, SJA, SHA-plan, byggesak og sluttdokumentasjon
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Hva er KS BYGG?</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        Et kvalitetssikringssystem tilpasset plan- og bygningsloven med SAK10. Alt arbeid
                        dokumenteres per prosjekt, slik at du enkelt kan vise kontroll overfor byggherre og kommune.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ScrollArea className="h-[600px] pr-4">
              <Accordion type="multiple" defaultValue={["ks-prosjekt"]} className="space-y-4">
                <AccordionItem value="ks-prosjekt" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Building2 className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Opprett prosjekt</p>
                        <p className="text-sm text-muted-foreground font-normal">Velg prosjekttype og kunde</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Gå til KS BYGG &gt; Prosjekter &gt; Nytt prosjekt. Velg kunde fra kundelisten, eller skriv inn
                        organisasjonsnummeret – navn og adresse hentes automatisk fra Brønnøysundregistrene.
                      </p>
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Badge variant="outline" className="shrink-0">Standard</Badge>
                          <div>
                            <p className="font-medium">Fullskala prosjekt</p>
                            <p className="text-sm text-muted-foreground">Alle moduler: byggesak, SHA, underleverandører, økonomi</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Badge variant="outline" className="shrink-0">Lite</Badge>
                          <div>
                            <p className="font-medium">Forenklet prosjekt</p>
                            <p className="text-sm text-muted-foreground">For mindre jobber – færre moduler i menyen</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Badge variant="outline" className="shrink-0">Mini</Badge>
                          <div>
                            <p className="font-medium">Småoppdrag</p>
                            <p className="text-sm text-muted-foreground">Kun det aller nødvendigste: sjekkliste, bilder, rapport</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ks-sjekklister" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Sjekklister</p>
                        <p className="text-sm text-muted-foreground font-normal">Utfylling på byggeplass med bilder og signatur</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Åpne prosjektet på mobilen, velg Sjekklister og start fra en mal. Du huker av punktene,
                        tar bilder direkte i skjemaet, skriver kommentarer og signerer på skjermen.
                      </p>
                      <div className="space-y-3">
                        <p className="font-medium">Statuser</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">Planlagt</Badge>
                          <ArrowRight className="h-4 w-4" />
                          <Badge variant="outline" className="bg-yellow-100">Under arbeid</Badge>
                          <ArrowRight className="h-4 w-4" />
                          <Badge variant="outline" className="bg-green-100">Fullført</Badge>
                        </div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-100">Hurtigutfylling</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                              Bruk hurtigutfylling for å godkjenne alle punkter samtidig, og korriger kun de som avviker.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ks-sja" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">SJA og vernerunder</p>
                        <p className="text-sm text-muted-foreground font-normal">Sikker jobbanalyse før risikofylt arbeid</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        SJA er en kort risikovurdering som gjøres rett før arbeid med høy risiko – arbeid i høyden,
                        varme arbeider, gravearbeid eller arbeid med strøm. Alle involverte signerer før oppstart.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Beskriv arbeidsoperasjonen</li>
                        <li>List farene som kan oppstå</li>
                        <li>Beskriv tiltak for hver fare</li>
                        <li>Send mobilen rundt – alle signerer på samme enhet</li>
                      </ol>
                      <p className="text-sm text-muted-foreground">
                        Vernerunder på byggeplass registreres på samme måte, med funn som kan gjøres om til avvik.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ks-avvik" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Avvik og endringsmeldinger</p>
                        <p className="text-sm text-muted-foreground font-normal">Følg opp feil og merkostnader</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Avvik meldes fra mobilen under prosjektet, får eget løpenummer og varsler ansvarlig.
                        Avviket lukkes med årsak og tiltak, og følger med i sluttrapporten.
                      </p>
                      <p>
                        Endringsmeldinger (EM-XXXX) brukes når arbeidet endres underveis, slik at merkostnader
                        og tilleggsarbeid er dokumentert overfor byggherre.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ks-byggesak" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10">
                        <FileText className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Byggesak og SHA-plan</p>
                        <p className="text-sm text-muted-foreground font-normal">SAK10-blanketter og byggherrens koordinator</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <p className="font-medium">Byggesak</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Blankett 5174 – søknad om tillatelse til tiltak</li>
                          <li>Blankett 5181 – erklæring om ansvarsrett</li>
                          <li>Blankett 5167 – gjennomføringsplan</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">
                          Skjemaene fylles ut i appen og lastes ned som PDF klar til innsending.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="font-medium">SHA-plan</p>
                        <p className="text-sm text-muted-foreground">
                          Koordinator for prosjektering (KP) og utførelse (KU) kobles til konkrete brukere og
                          signerer digitalt. Ekstern SHA-plan fra byggherre kan lastes opp som PDF.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ks-ue" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Users className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Underleverandører</p>
                        <p className="text-sm text-muted-foreground font-normal">Egenerklæring og dokumentasjon</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Registrer underleverandørene i prosjektet og last opp egenerklæring og KS-håndbok.
                        Har dere ingen underleverandører, kan modulen skjules slik at menyen blir enklere.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ks-dagsrapport" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-500/10">
                        <Clock className="h-5 w-5 text-rose-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Daglige rapporter og økonomi</p>
                        <p className="text-sm text-muted-foreground font-normal">Fremdrift, bemanning og kostnader</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        I daglig rapport registrerer du vær, bemanning, utført arbeid, hendelser og bilder.
                        Rapportene nummereres automatisk og samles i prosjektrapporten.
                      </p>
                      <p>
                        Under Økonomi laster du opp fakturaer og kvitteringer, og følger med på budsjett mot
                        påløpte kostnader i prosjektet.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ks-sluttrapport" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <BookOpen className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Sluttdokumentasjon</p>
                        <p className="text-sm text-muted-foreground font-normal">Én samlet PDF ved overlevering</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6">
                    <div className="space-y-4">
                      <p>
                        Gå til Prosjekt &gt; Dokumentasjon &gt; Generer rapport. Velg hvilke elementer som skal
                        være med, og last ned en samlet PDF med sjekklister, bilder, avvik, SJA, vernerunder
                        og signaturer.
                      </p>
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Lightbulb className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">Tips</p>
                            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                              Prosjekt-hjelperen kjenner prosjektet ditt og kan foreslå hvilke rutiner,
                              sjekklister og SAK10-krav som mangler før overlevering.
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
