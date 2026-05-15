import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  AlertTriangle, 
  Share, 
  Plus,
  CheckCircle2,
  Apple,
  Chrome,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageSeo } from "@/components/seo/PageSeo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAvvikApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
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
      <div className="min-h-screen bg-gradient-to-b from-destructive/10 to-background p-4 sm:p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-4 p-6 sm:p-8">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Avvik-appen er installert!</CardTitle>
            <CardDescription className="text-base">
              Du kan nå registrere avvik direkte fra startskjermen din.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Link to="/deviations">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tilbake til avvikshåndtering
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-destructive/10 to-background p-4 sm:p-6">
      <PageSeo
        title="Installer avviks-app"
        description="Installer en lett avviks-app fra Total-IK på mobilen for raske avviksmeldinger fra felt og byggeplass."
        path="/install/avvik"
      />
      <div className="max-w-md mx-auto space-y-4 sm:space-y-6 pt-6 sm:pt-8 pb-8">
        {/* Back button */}
        <Link to="/deviations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Tilbake til avvikshåndtering
        </Link>

        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-destructive flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-destructive-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold px-4">Avvik-appen</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Registrer avvik raskt og enkelt direkte fra mobilen
          </p>
        </div>

        {/* Benefits */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Fordeler med Avvik-appen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base">Rask registrering</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Meld avvik på sekunder fra byggeplass eller arbeidsplass</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base">Ta bilder direkte</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Dokumenter avvik med bilder fra kameraet</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base">Synkroniserer automatisk</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Avvik lagres og synkroniseres med Totalik</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base">Ingen app-butikk</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Installer direkte fra nettleseren</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Install Instructions */}
        {isIOS ? (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Apple className="w-5 h-5" />
                <CardTitle className="text-base sm:text-lg">Installer på iPhone/iPad</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm sm:text-base text-destructive">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Trykk på Del-knappen</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Share className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground">i Safari-menyen nederst</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm sm:text-base text-destructive">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Velg "Legg til på Hjem-skjerm"</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm text-muted-foreground">fra menyen som vises</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm sm:text-base text-destructive">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Trykk "Legg til"</p>
                  <span className="text-xs sm:text-sm text-muted-foreground">for å bekrefte installasjonen</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Chrome className="w-5 h-5" />
                <CardTitle className="text-base sm:text-lg">Installer på Android</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Klikk på knappen under for å installere Avvik-appen. Den vil være tilgjengelig fra startskjermen din.
              </p>
              <Button onClick={handleInstallClick} className="w-full gap-2 bg-destructive hover:bg-destructive/90" size="lg">
                <Download className="w-5 h-5" />
                Installer Avvik-appen
              </Button>
              <div className="pt-2 space-y-2 sm:space-y-3 border-t">
                <p className="text-xs sm:text-sm font-medium">Etter installasjon:</p>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Finn appen på startskjermen din</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Logg inn med din Totalik-bruker</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Registrer avvik med ett klikk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Installer appen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground">
                For å installere appen på Android:
              </p>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm sm:text-base text-destructive">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Åpne meny i Chrome</p>
                  <span className="text-xs sm:text-sm text-muted-foreground">⋮ øverst til høyre</span>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-sm sm:text-base text-destructive">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Velg "Legg til på startskjerm"</p>
                  <span className="text-xs sm:text-sm text-muted-foreground">eller "Installer app"</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <p className="text-center text-xs sm:text-sm text-muted-foreground pb-4 px-4">
            Avvik-appen er en del av Totalik og fungerer best i Chrome (Android) eller Safari (iPhone)
          </p>
        </div>
      </main>
  );
}
