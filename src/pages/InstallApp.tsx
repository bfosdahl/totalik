import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Smartphone, 
  Share, 
  Plus,
  CheckCircle2,
  Apple,
  Chrome,
  ArrowDown,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { PageSeo } from "@/components/seo/PageSeo";
import { t } from "@/i18n/t";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Hvis appen åpnes som installert PWA (standalone), send brukeren rett til hovedsiden
    // slik at de slipper å se install-veiledningen hver gang.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      navigate("/", { replace: true });
      return;
    }


    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      (/macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Detect Safari (not Chrome/Firefox on iOS)
    const isSafariBrowser = isIOSDevice && !(/crios|fxios|opios/.test(userAgent));
    setIsSafari(isSafariBrowser);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4 sm:p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-4 p-6 sm:p-8">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">{t("auto.appen_er_installert")}</CardTitle>
            <CardDescription className="text-base">
              {t("auto.du_kan_naa_bruke_total_ik_direkte_fra_st")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4 sm:p-6">
      <PageSeo
        title={t("auto.installer_total_ik_som_app")}
        description="Installer Total-IK som progressiv app (PWA) på iPhone, Android eller PC for rask tilgang til internkontroll, HMS og avvik."
        path="/install"
      />
      <div className="max-w-md mx-auto space-y-4 sm:space-y-6 pt-6 sm:pt-8 pb-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 sm:space-y-4"
        >
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold px-4">{t("auto.installer_total_ik")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            {t("auto.faa_rask_tilgang_til_internkontroll_hms_")}
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{t("auto.fordeler_med_appen")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">{t("auto.rask_tilgang_til_kursbevis")}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("auto.vis_kursbevis_ved_tilsyn_med_ett_klikk")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">{t("auto.fungerer_offline")}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("auto.se_kursbeviset_selv_uten_internett")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">{t("auto.ingen_app_butikk_noedvendig")}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("auto.installer_direkte_fra_nettleseren")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Install Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isIOS ? (
            <Card className="border-2 border-primary/20 overflow-hidden">
              <CardHeader className="p-4 sm:p-6 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                    <Apple className="w-6 h-6 text-background" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">{t("auto.installer_paa_iphone_ipad")}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("auto.3_enkle_steg_tar_under_10_sekunder")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Safari warning if not in Safari */}
                {!isSafari && isIOS && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4"
                  >
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      Åpne denne siden i Safari først
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("auto.paa_iphone_ipad_maa_du_bruke_safari_for_")}
                    </p>
                  </motion.div>
                )}

                {/* Step 1 */}
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-lg">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base">{t("auto.trykk_paa_del_knappen")}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {t("auto.firkant_ikonet_med_pil_opp_i_safari_meny")}
                    </p>
                    <div className="mt-2 bg-muted/50 rounded-lg p-3 flex items-center justify-center gap-2">
                      <Share className="w-6 h-6 text-primary" />
                      <ArrowDown className="w-4 h-4 text-muted-foreground animate-bounce" />
                      <span className="text-xs text-muted-foreground">{t("auto.finn_dette_ikonet_nederst_i_safari")}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-start gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-lg">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base">{t("auto.velg_legg_til_paa_hjem_skjerm")}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {t("auto.scroll_ned_i_menyen_som_dukker_opp_til_d")}
                    </p>
                    <div className="mt-2 bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{t("auto.legg_til_paa_hjem_skjerm")}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-lg">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base">{t("auto.trykk_legg_til_oeverst_til_hoeyre")}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {t("auto.total_ik_dukker_naa_opp_som_en_app_paa_s")}
                    </p>
                  </div>
                </motion.div>

                {/* Result preview */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="border-t pt-4 mt-4"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
                    {t("auto.resultatet_total_ik_paa_startskjermen")}
                  </p>
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-2xl bg-primary shadow-lg flex items-center justify-center">
                        <Smartphone className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <span className="text-[11px] font-medium">{t("auto.total_ik")}</span>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Chrome className="w-5 h-5" />
                  <CardTitle className="text-base sm:text-lg">{t("auto.installer_paa_android")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("auto.klikk_paa_knappen_under_for_aa_installer")}
                </p>
                <Button onClick={handleInstallClick} className="w-full gap-2" size="lg">
                  <Download className="w-5 h-5" />
                  Installer appen
                </Button>
                <div className="pt-2 space-y-2 sm:space-y-3 border-t">
                  <p className="text-xs sm:text-sm font-medium">{t("auto.etter_installasjon")}</p>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("auto.finn_appen_paa_startskjermen_din")}</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("auto.aapne_den_som_en_vanlig_app")}</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("auto.bruk_den_offline_naar_du_trenger_det")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">{t("auto.installer_appen")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("auto.for_aa_installere_appen_paa_android")}
                </p>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-sm sm:text-base text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">{t("auto.aapne_meny_i_chrome")}</p>
                    <span className="text-xs sm:text-sm text-muted-foreground">{t("auto.oeverst_til_hoeyre")}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-sm sm:text-base text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">Velg "Legg til på startskjerm"</p>
                    <span className="text-xs sm:text-sm text-muted-foreground">eller "Installer app"</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground pb-4 px-4">
          Total-IK fungerer best i Chrome (Android) eller Safari (iPhone)
        </p>
      </div>
    </main>
  );
}
