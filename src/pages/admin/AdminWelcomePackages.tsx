import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, Search, ShieldCheck, ShieldAlert } from "lucide-react";

interface CompanyRow {
  id: string;
  name: string;
  org_number: string | null;
  welcome_package_type: string | null;
  welcome_package_started_on: string | null;
  trial_ends_on: string | null;
}

interface AcceptanceRow {
  user_id: string;
  accepted_at: string;
  terms_version: string;
  user_agent: string | null;
  ip_address: string | null;
}

interface ProfileRow {
  user_id: string;
  company_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const formatNo = (value?: string | null) => {
  if (!value) return "-";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
};

const formatNoTime = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("nb-NO", { dateStyle: "long", timeStyle: "short" });
};

export default function AdminWelcomePackages() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [acceptances, setAcceptances] = useState<AcceptanceRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: comps } = await supabase
        .from("companies")
        .select("id, name, org_number, welcome_package_type, welcome_package_started_on, trial_ends_on")
        .eq("welcome_package", true)
        .order("welcome_package_started_on", { ascending: false });

      const companyRows = (comps ?? []) as unknown as CompanyRow[];
      setCompanies(companyRows);

      const ids = companyRows.map((c) => c.id);
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, company_id, first_name, last_name, email")
          .in("company_id", ids);
        const profileRows = (profs ?? []) as unknown as ProfileRow[];
        setProfiles(profileRows);

        const userIds = profileRows.map((p) => p.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: accs } = await supabase
            .from("user_terms_acceptance")
            .select("user_id, accepted_at, terms_version, user_agent, ip_address")
            .in("user_id", userIds)
            .order("accepted_at", { ascending: false });
          setAcceptances((accs ?? []) as unknown as AcceptanceRow[]);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.org_number ?? "").toLowerCase().includes(q),
      )
      .map((c) => {
        const companyProfiles = profiles.filter((p) => p.company_id === c.id);
        const companyAcceptances = companyProfiles
          .map((p) => {
            const acc = acceptances.find(
              (a) => a.user_id === p.user_id && a.terms_version.startsWith("velkomstpakke"),
            );
            return acc ? { profile: p, acceptance: acc } : null;
          })
          .filter(Boolean) as { profile: ProfileRow; acceptance: AcceptanceRow }[];
        return { company: c, acceptances: companyAcceptances };
      });
  }, [companies, profiles, acceptances, query]);

  return (
    <AdminLayout>
      <div className="space-y-6 print:space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Velkomstpakker og godkjente vilkår</h1>
            <p className="text-sm text-muted-foreground">
              Dokumentasjon på at kunden har godkjent vilkårene for gratisperioden.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Skriv ut
          </Button>
        </div>

        <div className="relative max-w-sm print:hidden">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Søk på bedrift eller org.nr"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Laster...
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Ingen bedrifter med velkomstpakke funnet.
            </CardContent>
          </Card>
        ) : (
          rows.map(({ company, acceptances: accs }) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  {company.welcome_package_type && (
                    <Badge variant="secondary">Velkomstpakke {company.welcome_package_type}</Badge>
                  )}
                  {accs.length > 0 ? (
                    <Badge className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Godkjent
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <ShieldAlert className="h-3 w-3" /> Ikke godkjent
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Org.nr {company.org_number ?? "-"} · Startet {formatNo(company.welcome_package_started_on)} ·
                  Oppsigelsesfrist {formatNo(company.trial_ends_on)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {accs.length === 0 ? (
                  <p className="text-muted-foreground">
                    Ingen bruker har godkjent vilkårene ennå.
                  </p>
                ) : (
                  accs.map(({ profile, acceptance }) => (
                    <div key={profile.user_id} className="rounded-md border p-3">
                      <p className="font-medium text-foreground">
                        {[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Ukjent bruker"}
                        {profile.email ? ` (${profile.email})` : ""}
                      </p>
                      <p className="text-muted-foreground">
                        Godkjent {formatNoTime(acceptance.accepted_at)}
                      </p>
                      <p className="text-muted-foreground">Versjon: {acceptance.terms_version}</p>
                      {acceptance.ip_address && (
                        <p className="text-muted-foreground">IP: {acceptance.ip_address}</p>
                      )}
                      {acceptance.user_agent && (
                        <p className="text-xs text-muted-foreground break-all">
                          Enhet: {acceptance.user_agent}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
