import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Building2, Coffee, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTimeClock } from "@/hooks/useTimeClock";

export default function TimeClock() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { activeEntry, clockIn, clockOut, startBreak, endBreak, isOnBreak, findQrCodeByCode, isLoading } = useTimeClock();
  
  const [qrCodeName, setQrCodeName] = useState<string | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<"in" | "out" | "break_start" | "break_end" | null>(null);

  const code = searchParams.get("kode");

  // Validate QR code on load
  useEffect(() => {
    const validateCode = async () => {
      if (code) {
        const qr = await findQrCodeByCode(code);
        if (qr) {
          setQrCodeName(qr.name);
          setQrCodeId(qr.id);
        }
      }
    };
    validateCode();
  }, [code]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      // Preserve the QR code in the redirect
      const returnUrl = code ? `/stemple?kode=${code}` : "/stemple";
      navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, code, navigate]);

  const handleClockIn = async () => {
    setProcessing(true);
    const result = await clockIn(qrCodeId || undefined);
    if (result) {
      setSuccess("in");
    }
    setProcessing(false);
  };

  const handleClockOut = async () => {
    setProcessing(true);
    const result = await clockOut(notes || undefined);
    if (result) {
      setSuccess("out");
      setNotes("");
    }
    setProcessing(false);
  };

  const handleStartBreak = async () => {
    setProcessing(true);
    const result = await startBreak();
    if (result) {
      setSuccess("break_start");
    }
    setProcessing(false);
  };

  const handleEndBreak = async () => {
    setProcessing(true);
    const result = await endBreak();
    if (result) {
      setSuccess("break_end");
    }
    setProcessing(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              success === "in" ? "bg-green-100 text-green-600" : 
              success === "out" ? "bg-blue-100 text-blue-600" :
              success === "break_start" ? "bg-amber-100 text-amber-600" :
              "bg-green-100 text-green-600"
            }`}>
              {success === "break_start" ? <Coffee className="h-10 w-10" /> : 
               success === "break_end" ? <Play className="h-10 w-10" /> :
               <CheckCircle className="h-10 w-10" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {success === "in" ? "Stemplet inn!" : 
               success === "out" ? "Stemplet ut!" :
               success === "break_start" ? "Pause startet!" :
               "Pause avsluttet!"}
            </h2>
            <p className="text-muted-foreground mb-2">
              {format(new Date(), "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
            </p>
            {qrCodeName && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Building2 className="h-4 w-4" />
                {qrCodeName}
              </p>
            )}
            <Button 
              className="mt-6" 
              variant="outline"
              onClick={() => setSuccess(null)}
            >
              Tilbake
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-2 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Stempling</CardTitle>
          {qrCodeName && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Building2 className="h-4 w-4" />
              {qrCodeName}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User info */}
          <div className="text-center pb-4 border-b">
            <p className="font-medium">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE d. MMMM yyyy", { locale: nb })}
            </p>
          </div>

          {/* Current status */}
          {activeEntry ? (
            <div className="space-y-4">
              {isOnBreak ? (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 mb-1">
                    <Coffee className="h-5 w-5" />
                    <span className="font-medium">Du er på pause</span>
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Siden {format(new Date(activeEntry.break_start!), "HH:mm", { locale: nb })}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 mb-1">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Du er stemplet inn</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Siden {format(new Date(activeEntry.clock_in), "HH:mm", { locale: nb })}
                    {activeEntry.total_break_minutes ? ` • ${activeEntry.total_break_minutes} min pause` : ""}
                  </p>
                </div>
              )}

              {/* Pause button */}
              {isOnBreak ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600"
                  onClick={handleEndBreak}
                  disabled={processing}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {processing ? "Avslutter pause..." : "Avslutt pause"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full h-12 text-base"
                  variant="outline"
                  onClick={handleStartBreak}
                  disabled={processing}
                >
                  <Coffee className="mr-2 h-5 w-5" />
                  {processing ? "Starter pause..." : "Start pause"}
                </Button>
              )}

              {/* Notes for clock out */}
              {!isOnBreak && (
                <div>
                  <Label htmlFor="notes">Notat (valgfritt)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Legg til et notat om arbeidsdagen..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-14 text-lg"
                variant="destructive"
                onClick={handleClockOut}
                disabled={processing || isOnBreak}
              >
                <LogOut className="mr-2 h-5 w-5" />
                {processing ? "Stempler ut..." : "Stemple ut"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <AlertCircle className="h-5 w-5" />
                  <span>Ikke stemplet inn</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Trykk på knappen under for å starte arbeidsdagen
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handleClockIn}
                disabled={processing}
              >
                <LogIn className="mr-2 h-5 w-5" />
                {processing ? "Stempler inn..." : "Stemple inn"}
              </Button>
            </div>
          )}

          {/* Time display */}
          <div className="text-center pt-4 border-t">
            <p className="text-4xl font-mono font-bold text-primary">
              {format(new Date(), "HH:mm")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
