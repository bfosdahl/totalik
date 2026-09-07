import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Megaphone, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MODULES: { value: string; label: string }[] = [
  { value: "IK_BYGG", label: "KS Bygg" },
  { value: "IK_HMS", label: "IK HMS" },
  { value: "IK_MAT", label: "IK Mat" },
  { value: "IK_ALKOHOL", label: "IK Alkohol" },
  { value: "IK_FDV", label: "FDV" },
  { value: "PERSONALHANDBOK", label: "Personalhåndbok" },
  { value: "TIMEREGISTRERING", label: "Timeregistrering" },
];

export default function AdminNyheter() {
  const { profile } = useAuth();
  const [moduleType, setModuleType] = useState("IK_BYGG");
  const [audience, setAudience] = useState<"company_admins" | "all_users">("company_admins");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testEmail, setTestEmail] = useState(profile?.email ?? "");
  const [counts, setCounts] = useState<{ companies: number; recipients: number } | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsCounting(true);
      setCounts(null);
      try {
        const { data, error } = await supabase.functions.invoke("send-product-news", {
          body: { moduleType, audience, dryRun: true },
        });
        if (error) throw error;
        if (!cancelled) setCounts({ companies: data?.companies ?? 0, recipients: data?.recipients ?? 0 });
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || "Kunne ikke hente mottakere");
      } finally {
        if (!cancelled) setIsCounting(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [moduleType, audience]);

  const send = async (asTest: boolean) => {
    if (subject.trim().length < 3) {
      toast.error("Skriv et emne");
      return;
    }
    if (body.trim().length < 10) {
      toast.error("Skriv en melding");
      return;
    }
    if (asTest && !testEmail.trim()) {
      toast.error("Fyll inn en e-postadresse for testen");
      return;
    }
    if (!asTest) {
      const ok = window.confirm(
        `Send til ${counts?.recipients ?? 0} mottakere i ${counts?.companies ?? 0} bedrifter?`,
      );
      if (!ok) return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-product-news", {
        body: {
          moduleType,
          audience,
          subject: subject.trim(),
          body: body.trim(),
          testEmail: asTest ? testEmail.trim() : null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(asTest ? `Testmail sendt til ${testEmail}` : `Sendt til ${data?.sent ?? 0} mottakere`);
    } catch (e: any) {
      toast.error(e?.message || "Kunne ikke sende e-post");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div className="flex items-center gap-2 text-primary">
        <Megaphone className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Nyheter til kunder</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Send informasjon om nye funksjoner og endringer til kunder som har en bestemt modul aktiv.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mottakere</CardTitle>
          <CardDescription>Velg hvilken modul kundene må ha, og hvem i bedriften som skal få e-posten.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Modul</Label>
              <Select value={moduleType} onValueChange={setModuleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hvem skal motta</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admins">Kun bedriftsadministratorer</SelectItem>
                  <SelectItem value="all_users">Alle aktive brukere</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            {isCounting ? (
              <span className="text-muted-foreground">Teller mottakere ...</span>
            ) : (
              <>
                <Badge variant="secondary">{counts?.companies ?? 0} bedrifter</Badge>
                <Badge variant="secondary">{counts?.recipients ?? 0} mottakere</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Innhold</CardTitle>
          <CardDescription>Skriv kort og konkret. Tomme linjer blir egne avsnitt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Emne</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nyheter i KS Bygg"
              maxLength={150}
            />
          </div>
          <div className="space-y-2">
            <Label>Melding</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder={"Vi har gjort flere forbedringer i KS Bygg:\n\n- Kundekort som samler alle prosjekter på samme kunde\n- Arbeidsplan for flere ansatte samtidig\n- Siste 3 måneder i timerapporten"}
            />
          </div>

          <div className="space-y-2">
            <Label>Test til deg selv</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="din@epost.no"
              />
              <Button variant="outline" onClick={() => send(true)} disabled={isSending}>
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                <span className="ml-2">Send test</span>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button onClick={() => send(false)} disabled={isSending || !counts?.recipients}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="ml-2">Send til {counts?.recipients ?? 0} mottakere</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
