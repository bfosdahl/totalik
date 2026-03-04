import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Key, Smartphone, Loader2, Eye, EyeOff, Check, X, Copy, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

interface SecuritySettingsProps {
  onBack: () => void;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Nåværende passord er påkrevd"),
  newPassword: z
    .string()
    .min(8, "Passord må være minst 8 tegn")
    .regex(/[A-Z]/, "Passord må inneholde minst én stor bokstav")
    .regex(/[a-z]/, "Passord må inneholde minst én liten bokstav")
    .regex(/[0-9]/, "Passord må inneholde minst ett tall"),
  confirmPassword: z.string().min(1, "Bekreft passord er påkrevd"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passordene stemmer ikke overens",
  path: ["confirmPassword"],
});

export function SecuritySettings({ onBack }: SecuritySettingsProps) {
  const { profile, refreshProfile } = useAuth();

  // Profile edit state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [loadingMfa, setLoadingMfa] = useState(true);

  // Check MFA status on mount
  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    setLoadingMfa(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactor = data.totp.find((f) => f.status === "verified");
      if (totpFactor) {
        setMfaEnabled(true);
        setMfaFactorId(totpFactor.id);
      } else {
        setMfaEnabled(false);
        setMfaFactorId(null);
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
    } finally {
      setLoadingMfa(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordErrors([]);

    // Validate
    const result = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      setPasswordErrors(result.error.errors.map((e) => e.message));
      return;
    }

    setChangingPassword(true);
    try {
      // First verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Kunne ikke hente brukerinfo");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordErrors(["Nåværende passord er feil"]);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Passord oppdatert!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Kunne ikke endre passord");
    } finally {
      setChangingPassword(false);
    }
  };

  const startMfaEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
      setMfaFactorId(data.id);
    } catch (error: any) {
      console.error("Error starting MFA enrollment:", error);
      toast.error(error.message || "Kunne ikke starte oppsett av 2FA");
    } finally {
      setEnrolling(false);
    }
  };

  const verifyMfaEnrollment = async () => {
    if (!mfaFactorId || verifyCode.length !== 6) return;

    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast.success("Tofaktorautentisering er aktivert!");
      setMfaEnabled(true);
      setQrCode(null);
      setTotpSecret(null);
      setVerifyCode("");
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast.error(error.message || "Feil kode. Prøv igjen.");
    } finally {
      setVerifying(false);
    }
  };

  const disableMfa = async () => {
    if (!mfaFactorId) return;

    setDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: mfaFactorId,
      });

      if (error) throw error;

      toast.success("Tofaktorautentisering er deaktivert");
      setMfaEnabled(false);
      setMfaFactorId(null);
    } catch (error: any) {
      console.error("Error disabling MFA:", error);
      toast.error(error.message || "Kunne ikke deaktivere 2FA");
    } finally {
      setDisabling(false);
    }
  };

  const cancelEnrollment = async () => {
    if (mfaFactorId && !mfaEnabled) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      } catch (error) {
        console.error("Error canceling enrollment:", error);
      }
    }
    setQrCode(null);
    setTotpSecret(null);
    setVerifyCode("");
    setMfaFactorId(null);
  };

  const copySecret = () => {
    if (totpSecret) {
      navigator.clipboard.writeText(totpSecret);
      toast.success("Hemmelighet kopiert til utklippstavle");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sikkerhet</h1>
            <p className="text-muted-foreground">
              Passord og tofaktorautentisering
            </p>
          </div>
        </div>
      </motion.div>

      {/* Password Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Endre passord</h3>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current-password">Nåværende passord</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nytt passord</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex items-center gap-1">
                {newPassword.length >= 8 ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-destructive" />}
                Minst 8 tegn
              </div>
              <div className="flex items-center gap-1">
                {/[A-Z]/.test(newPassword) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-destructive" />}
                Minst én stor bokstav
              </div>
              <div className="flex items-center gap-1">
                {/[a-z]/.test(newPassword) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-destructive" />}
                Minst én liten bokstav
              </div>
              <div className="flex items-center gap-1">
                {/[0-9]/.test(newPassword) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-destructive" />}
                Minst ett tall
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Bekreft nytt passord</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <X className="w-3 h-3" /> Passordene stemmer ikke overens
              </p>
            )}
          </div>

          {passwordErrors.length > 0 && (
            <div className="text-sm text-destructive space-y-1">
              {passwordErrors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          )}

          <Button
            onClick={handlePasswordChange}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Endrer passord...
              </>
            ) : (
              "Endre passord"
            )}
          </Button>
        </div>
      </motion.div>

      {/* MFA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Tofaktorautentisering (2FA)</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Legg til et ekstra lag med sikkerhet ved å kreve en kode fra autentiseringsappen din ved innlogging.
        </p>

        {loadingMfa ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Laster...
          </div>
        ) : mfaEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">2FA er aktivert</p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Kontoen din er beskyttet med tofaktorautentisering
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={disableMfa}
              disabled={disabling}
            >
              {disabling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deaktiverer...
                </>
              ) : (
                "Deaktiver 2FA"
              )}
            </Button>
          </div>
        ) : qrCode ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <p className="text-sm font-medium mb-2">1. Skann QR-koden</p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Eller skriv inn manuelt:</p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-secondary rounded text-sm font-mono break-all">
                      {totpSecret}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copySecret}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">2. Skriv inn koden fra appen</p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-32 text-center font-mono text-lg tracking-widest"
                      maxLength={6}
                    />
                    <Button
                      onClick={verifyMfaEnrollment}
                      disabled={verifying || verifyCode.length !== 6}
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Bekreft"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={cancelEnrollment}>
              Avbryt
            </Button>
          </div>
        ) : (
          <Button onClick={startMfaEnrollment} disabled={enrolling}>
            {enrolling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starter oppsett...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Aktiver 2FA
              </>
            )}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
