import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, User, Loader2, Building2, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { useTranslate } from "@/hooks/useTranslate";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { signIn, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslate();

  // Dynamic validation schemas with translations
  const loginSchema = z.object({
    email: z.string().email(t("auth.emailInvalid")),
    password: z.string().min(6, t("auth.passwordMinLength")),
  });

  const signupSchema = loginSchema.extend({
    firstName: z.string().min(1, t("auth.firstNameRequired") || "Fornavn er påkrevd").max(50),
    lastName: z.string().min(1, t("auth.lastNameRequired") || "Etternavn er påkrevd").max(50),
    companyName: z.string().min(2, t("auth.companyNameMinLength") || "Bedriftsnavn må være minst 2 tegn").max(100),
    orgNumber: z.string().regex(/^\d{9}$/, t("auth.orgNumberFormat") || "Org.nr må være 9 siffer"),
  });

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.info("[Auth] PASSWORD_RECOVERY event detected");
        setIsPasswordRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle setting new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Passordet må være minst 6 tegn");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passordene stemmer ikke overens");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Passordet er oppdatert! Du blir nå logget inn.");
        setIsPasswordRecovery(false);
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "Kunne ikke oppdatere passordet");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    // Don't redirect if user is in password recovery mode
    if (isPasswordRecovery) return;
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate, isPasswordRecovery]);

  const handleForgotPassword = async () => {
    const validation = z.string().email(t("auth.emailInvalid")).safeParse(email);
    if (!validation.success) {
      toast.error(t("auth.enterEmailFirst") || "Skriv inn e-postadressen din først");
      return;
    }

    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("auth.resetEmailSent") || "Sjekk e-posten din for lenke til å sette nytt passord");
  };

  const handleSignUp = async () => {
    const redirectUrl = `${window.location.origin}/`;

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error(t("auth.userNotCreated") || "Bruker ble ikke opprettet");

    // Ensure we have an active session (session can be null if email confirmation is required)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        throw new Error(
          t("auth.accountCreatedNeedConfirm") || "Konto opprettet, men du må bekrefte e-post/eller logge inn før bedrift kan opprettes."
        );
      }
    }

    // Wait a moment for the profile trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create the company
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyName.trim(),
        org_number: orgNumber.trim(),
      })
      .select()
      .maybeSingle();

    if (companyError || !newCompany) {
      console.error("Error creating company:", companyError);
      throw new Error(
        companyError?.message || t("auth.companyCreateError") || "Kunne ikke opprette bedrift (mangler tilgang/innlogging)"
      );
    }

    // Update user profile with company_id
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        company_id: newCompany.id,
        status: "active",
      })
      .eq("user_id", authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Add user as company_admin
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "company_admin",
      });

    if (roleError && !roleError.message.includes("duplicate")) {
      console.error("Error adding role:", roleError);
    }

    // NOTE: IK_HMS module is NOT created here anymore
    // Users must accept subscription terms in Setup page first
    // This ensures proper consent before activating the module

    // Send welcome email
    try {
      await supabase.functions.invoke("send-welcome-email", {
        body: {
          userId: authData.user.id,
          email: email,
          firstName: firstName,
        },
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
    }

    // Notify admin (Gard) about new company registration
    try {
      await supabase.functions.invoke("notify-new-company", {
        body: {
          companyName: companyName.trim(),
          contactPerson: `${firstName} ${lastName}`,
          contactEmail: email,
        },
      });
    } catch (notifyError) {
      console.error("Error sending admin notification:", notifyError);
    }

    return { error: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast.error(
            error.message === "Invalid login credentials"
              ? t("auth.invalidCredentials")
              : error.message
          );
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, firstName, lastName, companyName, orgNumber });
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        await handleSignUp();
        toast.success(t("auth.accountCreatedSuccess") || "Konto og bedrift opprettet! Velkommen!");
        navigate("/setup/ai");
      }
    } catch (error: any) {
      if (error.message?.includes("already registered")) {
        toast.error(t("auth.emailAlreadyRegistered") || "Denne e-postadressen er allerede registrert");
      } else {
        toast.error(error.message || t("errors.somethingWentWrong"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative">
      {/* Language selector in top right */}
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="full" className="bg-white/10 hover:bg-white/20 text-white" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/total-ik-logo.png" 
            alt="Total-IK" 
            className="h-16 mx-auto"
          />
        </div>

        {/* Auth card */}
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {isPasswordRecovery ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-center mb-2">Sett nytt passord</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">Velg et nytt passord for kontoen din.</p>
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nytt passord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Minst 6 tegn"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Bekreft passord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Gjenta passordet"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Oppdaterer...
                    </>
                  ) : "Lagre nytt passord"}
                </Button>
              </form>
            </>
          ) : (
            <>
          <h1 className="sr-only">{t("auth.login")}</h1>
          <h2 className="text-xl font-semibold text-center mb-6">
            {isLogin ? t("auth.login") : t("auth.createCompanyAccount") || "Opprett bedriftskonto"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Company name - first for new signups */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t("auth.companyName") || "Bedriftsnavn"}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10"
                      placeholder={t("auth.companyNamePlaceholder") || "Din bedrift AS"}
                    />
                  </div>
                  {errors.companyName && (
                    <p className="text-xs text-destructive">{errors.companyName}</p>
                  )}
                </div>

                {/* Organization number */}
                <div className="space-y-2">
                  <Label htmlFor="orgNumber">{t("auth.orgNumber") || "Organisasjonsnummer"}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="orgNumber"
                      value={orgNumber}
                      onChange={(e) => setOrgNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      className="pl-10"
                      placeholder="123456789"
                      maxLength={9}
                    />
                  </div>
                  {errors.orgNumber && (
                    <p className="text-xs text-destructive">{errors.orgNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("employees.firstName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        placeholder="Ola"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("employees.lastName")}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nordmann"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="din@epost.no"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? t("auth.loggingIn") || "Logger inn..." : t("auth.creatingAccount") || "Oppretter bedrift..."}
                </>
              ) : isLogin ? (
                t("auth.login")
              ) : (
                t("auth.createCompanyAccount") || "Opprett bedriftskonto"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-muted-foreground hover:text-primary hover:underline block w-full"
              >
                {t("auth.forgotPassword")}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? t("auth.dontHaveAccount") + " " + t("auth.signUp") : t("auth.alreadyHaveAccount") + " " + t("auth.login")}
            </button>
          </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
