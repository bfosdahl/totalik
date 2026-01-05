import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, User, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(6, "Passordet må være minst 6 tegn"),
  firstName: z.string().min(1, "Fornavn er påkrevd").max(50),
  lastName: z.string().min(1, "Etternavn er påkrevd").max(50),
});

export default function SetupSystemAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingAdmin, setHasExistingAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if any system admin exists
  useEffect(() => {
    const checkExistingAdmin = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("has-system-admin");
        if (error) throw error;
        setHasExistingAdmin(!!data?.hasSystemAdmin);
      } catch (error) {
        // If we can't check (network/RLS/etc), fail safe by not allowing creation here.
        console.error("Error checking admin:", error);
        setHasExistingAdmin(true);
      }
    };

    checkExistingAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validation = signupSchema.safeParse({ email, password, firstName, lastName });
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

      // 1. Create user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("No user returned");

      // 2. Assign system_admin role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "system_admin",
      });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        // Role assignment might fail due to RLS - this is expected for first admin
        // The user is still created, they just need to manually add the role
        toast({
          title: "Bruker opprettet",
          description: "Bruker er opprettet, men rollen må tildeles manuelt via database.",
          variant: "default",
        });
      } else {
        setSuccess(true);
        toast({
          title: "System Admin opprettet!",
          description: "Du kan nå logge inn med denne kontoen.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (hasExistingAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (hasExistingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/20 mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">System Admin finnes</h1>
          <p className="text-white/60 mb-6">
            En systemadministrator er allerede konfigurert.
          </p>
          <Button onClick={() => navigate("/auth")} variant="secondary">
            Gå til innlogging
          </Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/20 mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">System Admin opprettet!</h1>
          <p className="text-white/60 mb-6">
            Du kan nå logge inn med din nye konto.
          </p>
          <Button onClick={() => navigate("/auth")} variant="secondary">
            Gå til innlogging
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/20 mb-4">
            <Shield className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-white">Første oppstart</h1>
          <p className="text-white/60 text-sm mt-1">Opprett din første System Admin</p>
        </div>

        {/* Form card */}
        <div className="bg-card rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Fornavn</Label>
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
                <Label htmlFor="lastName">Etternavn</Label>
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

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="admin@bedrift.no"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passord</Label>
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

            <Button type="submit" className="w-full bg-warning text-warning-foreground hover:bg-warning/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oppretter...
                </>
              ) : (
                "Opprett System Admin"
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            Denne siden vises kun når ingen System Admin finnes i systemet.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
